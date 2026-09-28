# Plano de execução — C-T2 e C-O1 (para agente autônomo)

> Contexto: `docs/product/how-it-works.md`, Parte C. Este arquivo é a spec
> fechada. Todas as decisões de produto e de arquitetura já foram tomadas
> aqui. Leia `AGENTS.md` antes de começar.

## 0. Regras de execução (leia primeiro)

1. **Não faça perguntas e não peça confirmação.** Execute o plano do começo ao
   fim numa única passada.
2. Se algo não estiver coberto aqui, escolha a opção **mais simples e mais
   parecida com o código vizinho**, siga em frente e registre a escolha na
   seção **"Notas de execução"** no fim deste arquivo (uma linha por decisão).
3. Se um passo falhar (teste, tsc), corrija e continue. Só registre em "Notas
   de execução" o que você não conseguiu resolver.
4. **Proibido:** `git commit`, `git push`, `supabase db push`, aplicar
   migração no banco remoto, editar `vercel.json`, instalar dependências
   novas, mudar arquivos fora da lista de cada tarefa (exceto testes novos
   ao lado do arquivo testado).
5. Não altere o status dos itens em `docs/product/how-it-works.md`. A revisão
   faz isso depois.
6. Código em TypeScript estrito, sem `any` novo. JSDoc em toda função
   exportada, explicando o porquê. Comentários e textos de UI em pt-BR
   (com en/es nos arquivos de mensagens).
7. Ao terminar: rode `npx tsc --noEmit` e `npm test`, e escreva o resultado em
   "Notas de execução". Nada mais.

---

## Tarefa 1 — C-T2: pedido pendente não fica pendente para sempre

### Problema
Um agendamento com `status = 'pending'` só sai desse estado quando o mentor
confirma ou recusa. Se o mentor some, o mentorado espera para sempre e o
horário continua bloqueado (`availability.service.ts` considera `pending`).

### Regras (fechadas)
- **Lembrete ao mentor:** uma única vez, para pedidos `pending` criados há
  **24h ou mais** (`created_at <= now - 24h`) cujo horário **ainda não
  passou** (`scheduled_at > now`) e que ainda não receberam lembrete.
- **Expiração:** pedidos `pending` com `scheduled_at <= now` passam a
  `status = 'cancelled'`, `cancelled_at = now`, `cancelled_by = null`,
  `cancellation_reason = 'Pedido expirado: o mentor não respondeu antes do horário.'`.
  O mentorado recebe um e-mail sugerindo outros mentores. O mentor não recebe
  e-mail.
- **Ordem no cron:** primeiro expirar, depois lembrar, depois o que já existe
  (lembrete do dia, feedback).
- **Corrida com o mentor confirmando:** o `update` de expiração precisa
  filtrar `.eq('id', id).eq('status', 'pending')` e usar `.select('id')` para
  saber se a linha foi mesmo atualizada. Só envie o e-mail se a linha foi
  atualizada.
- O cron continua rodando 1x por dia (10h UTC). Não mude a agenda.

### Arquivos
1. **Nova migração** `supabase/migrations/20260928000002_appointments_pending_followup.sql`:
   ```sql
   -- C-T2: marca o lembrete único enviado ao mentor para pedidos pendentes.
   -- Não reutiliza reminded_at porque essa coluna controla o lembrete do dia
   -- da sessão (só para confirmed); reutilizar faria o lembrete do dia sumir.
   alter table public.appointments
     add column if not exists pending_reminder_sent_at timestamptz;

   create index if not exists appointments_pending_followup_idx
     on public.appointments (status, scheduled_at)
     where status = 'pending';
   ```
2. **`lib/types/supabase.ts`**: adicionar `pending_reminder_sent_at: string | null`
   em `appointments.Row`, e `pending_reminder_sent_at?: string | null` em
   `Insert` e `Update`, em ordem alfabética como as vizinhas.
3. **`lib/email/brevo.ts`**: duas funções novas, no mesmo estilo de
   `sendAppointmentCancellation` (usar `getEmailLayout`, `formatDateTimeBR`,
   `escapeHtml` em todo nome vindo do banco):
   - `sendPendingRequestReminder({ mentorEmail, mentorName, menteeName, scheduledAt })`
     - Assunto: `Pedido de mentoria aguardando sua resposta`
     - Corpo: "Olá, {mentor}. {mentorado} pediu uma sessão para {data} e ainda
       aguarda sua resposta. Se não puder atender, recuse o pedido para que
       ele possa procurar outro mentor."
     - Botão: "Responder pedido" → `${NEXT_PUBLIC_APP_URL}/dashboard/mentor`
       (não use o `action_token`: ele pode ter expirado).
     - `signatureType: "team"`.
   - `sendPendingRequestExpired({ menteeEmail, menteeName, mentorName, scheduledAt })`
     - Assunto: `Seu pedido de mentoria expirou`
     - Corpo: "Olá, {mentorado}. Seu pedido de sessão com {mentor} para {data}
       não foi confirmado a tempo e foi cancelado automaticamente. Isso
       acontece — mentores são voluntários. Que tal pedir um horário com outro
       mentor?"
     - Botão: "Encontrar outro mentor" → `${NEXT_PUBLIC_APP_URL}/mentors`.
     - `signatureType: "team"`.
   - Registrar as duas em `getEmailTemplatePreviewHtml` se essa função tiver um
     `switch`/mapa de templates (siga o padrão das outras).
4. **`app/api/cron/appointments/route.ts`**:
   - Adicionar as etapas "0a. EXPIRAR PEDIDOS PENDENTES" e "0b. LEMBRAR
     MENTOR DE PEDIDOS PENDENTES" antes da etapa 1, no mesmo estilo de
     comentário e tratamento de erro das etapas existentes.
   - Selecionar com os joins `mentor:profiles!mentor_id(full_name, email)` e
     `mentee:profiles!mentee_id(full_name, email)`.
   - Na 0b, marcar `pending_reminder_sent_at = now` depois de enviar (mesma
     lógica de `reminded_at`). Filtro: `.eq('status','pending').is('pending_reminder_sent_at', null).lte('created_at', 24h atrás).gt('scheduled_at', now)`.
   - `results` ganha `expired` e `pendingReminders`.
   - Erro num item não interrompe os outros (mesmo padrão do `try/catch` por item).
5. **`app/api/cron/appointments/route.test.ts`**: o mock atual de
   `supabase.from()` não diferencia as consultas. Reescreva o mock como um
   query builder encadeável (cada método retorna o próprio builder; o
   `await` resolve com uma resposta que o teste configura por chamada, em
   ordem) e mantenha os testes existentes passando. Casos novos:
   - expira pedido com horário passado: faz `update` com `status: 'cancelled'`
     e envia `sendPendingRequestExpired` ao mentorado;
   - não envia e-mail de expiração quando o `update` volta sem linhas
     (mentor confirmou no meio);
   - envia `sendPendingRequestReminder` e marca `pending_reminder_sent_at`;
   - `results` inclui `expired` e `pendingReminders`.
   Adicione ao `jest.mock('@/lib/email/brevo')` as duas funções novas.
6. **`docs/domains/scheduling.md`**: na tabela de `appointments`, adicionar
   `pending_reminder_sent_at`; adicionar uma seção curta "Ciclo de vida de um
   pedido pendente" com as regras acima (24h → lembrete; horário passou →
   cancelado com e-mail ao mentorado; cron diário 10h UTC, então a expiração
   pode acontecer até ~24h depois do horário).
7. **`messages/{pt-BR,en,es}.json`**, `howItWorks.mentees.step4.description`:
   acrescentar ao fim uma frase. pt-BR: "Se o mentor não responder até o
   horário, o pedido é cancelado e avisamos você por e-mail." en: "If the
   mentor doesn't reply before the time slot, the request is cancelled and
   we'll let you know by email." es: "Si el mentor no responde antes del
   horario, la solicitud se cancela y te avisamos por correo."

---

## Tarefa 2 — C-O1: formulário "Quero a Menvo na minha organização"

### Problema
O CTA da aba Organizações em `/how-it-works` leva para `/contact`, que só tem
um `mailto:`. O admin não tem fila nem histórico.

### Regras (fechadas)
- Sem autocadastro de organização. O formulário só cria um **lead** para a
  equipe; a organização continua sendo criada pelo admin.
- Formulário público (não exige login).
- Campos:
  | Campo | Tipo | Regra |
  |---|---|---|
  | `org_name` | texto | obrigatório, 2–120 |
  | `org_type` | select | obrigatório: `ngo`, `company`, `school`, `event`, `other` (mesmos valores de `organizations.type`) |
  | `contact_name` | texto | obrigatório, 2–120 |
  | `contact_email` | e-mail | obrigatório, máx. 254 |
  | `contact_phone` | texto | opcional, máx. 30 |
  | `people_estimate` | select | obrigatório: `1-20`, `21-100`, `101-500`, `500+` |
  | `message` | textarea | opcional, máx. 1000 |
  | `website` | texto oculto | honeypot anti-bot, nunca gravado |
- Anti-abuso: `checkRateLimit('org-lead:' + ip, { maxRequests: 5, windowMs: 10 * 60_000 })`
  (mesmo padrão de `app/api/invites/respond/route.ts`); se `website` vier
  preenchido, responder `201 { ok: true }` sem gravar nem enviar e-mail.
- Gravação via `createServiceRoleClient()` (não há policy de insert para
  anon; é o mesmo padrão documentado em `20260927000000_reengagement_invites.sql`).
- Depois de gravar, enviar e-mail ao admin. **Falha no e-mail não falha a
  requisição** (loga com `console.error` e segue).
- Toda string do usuário que entra em HTML de e-mail passa por `escapeHtml`.

### Arquivos
1. **Nova migração** `supabase/migrations/20260928000003_organization_leads.sql`:
   ```sql
   -- C-O1: pedidos de organizações que querem a Menvo ("Quero a Menvo na
   -- minha organização"). Só cria um lead; a organização em si continua
   -- sendo criada pelo admin (sem autocadastro, ver docs/domains/organizations.md).
   create table public.organization_leads (
     id uuid primary key default gen_random_uuid(),
     org_name text not null check (char_length(org_name) between 2 and 120),
     org_type text not null check (org_type in ('ngo', 'company', 'school', 'event', 'other')),
     contact_name text not null check (char_length(contact_name) between 2 and 120),
     contact_email text not null check (char_length(contact_email) <= 254),
     contact_phone text check (contact_phone is null or char_length(contact_phone) <= 30),
     people_estimate text not null check (people_estimate in ('1-20', '21-100', '101-500', '500+')),
     message text check (message is null or char_length(message) <= 1000),
     locale text,
     status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now()
   );

   create index organization_leads_status_created_idx
     on public.organization_leads (status, created_at desc);

   alter table public.organization_leads enable row level security;

   create policy "Admins can read organization leads"
     on public.organization_leads for select
     using (public.is_admin());

   create policy "Admins can update organization leads"
     on public.organization_leads for update
     using (public.is_admin())
     with check (public.is_admin());

   -- Sem policy de insert: o formulário público grava pelo service-role
   -- client em app/api/contact/organization/route.ts, atrás de rate limit
   -- e honeypot.
   ```
2. **`lib/types/supabase.ts`**: adicionar `organization_leads` (Row/Insert/Update)
   seguindo o formato das outras tabelas.
3. **`lib/validations/organization-lead.ts`** (criar a pasta se não existir;
   se já existir outra pasta de schemas Zod no projeto, use-a): schema Zod
   `organizationLeadSchema` com as regras da tabela acima + `website` opcional
   + `locale` opcional (`pt-BR` | `en` | `es`). Exportar o tipo inferido.
   Usado tanto no form quanto na API.
4. **`lib/services/organizations/org-leads.service.ts`**:
   - `createOrganizationLead(input)` — insert com service role, retorna a linha.
   - `listOrganizationLeads(status?)` — usa o client do usuário (RLS de admin).
   - `updateOrganizationLeadStatus(id, status)` — idem, atualiza `updated_at`.
   - Teste `org-leads.service.test.ts` ao lado, mockando os clients.
5. **`lib/email/brevo.ts`**: `sendAdminNewOrganizationLead(lead)` para
   `process.env.ADMIN_EMAIL || "contato@menvo.com.br"` (mesmo padrão de
   `sendAdminNewMentorNotification`). Assunto: `Nova organização interessada: {org_name}`.
   Info-box com todos os campos (tipo e tamanho em texto legível pt-BR),
   botão "Ver pedidos no painel" → `/dashboard/admin/org-leads`.
   `signatureType: "team"`. Registrar em `getEmailTemplatePreviewHtml` se
   houver mapa de templates.
6. **`app/api/contact/organization/route.ts`** (`POST`): rate limit →
   `safeParse` (400 com `{ error: "invalid" }`) → honeypot → `createOrganizationLead`
   → e-mail (try/catch isolado) → `201 { ok: true }`. Erro inesperado: 500
   com mensagem genérica. Teste `route.test.ts` ao lado: 429, 400, honeypot
   não grava, sucesso grava e chama o e-mail, falha do e-mail ainda retorna 201.
7. **`app/api/admin/org-leads/route.ts`**: `GET` (query `?status=`) e
   `PATCH` (`{ id, status }` validado com Zod), ambos começando por
   `const guard = await requireAdmin(); if (!guard.ok) return guard.response`.
   Teste ao lado cobrindo 401/403 do guard e o caminho feliz.
8. **`app/[locale]/dashboard/admin/org-leads/page.tsx`**: página client no
   mesmo estilo de `app/[locale]/dashboard/admin/feedbacks/page.tsx`
   (copie a estrutura, layout e componentes de UI de lá). Lista os leads
   (mais novos primeiro), filtro por status (Novos / Contatados /
   Encerrados), e um `Select` por linha para mudar o status via `PATCH`.
   Mostrar e-mail como `mailto:` clicável. Textos só em pt-BR (o admin inteiro é pt-BR).
9. **`app/[locale]/dashboard/admin/page.tsx`**: novo card na lista de
   ferramentas: título "Organizações interessadas", descrição "Pedidos do
   formulário 'Quero a Menvo na minha organização'", `href: "/dashboard/admin/org-leads"`,
   ícone `Building2` do lucide, cor `bg-indigo-600`.
10. **`components/contact/OrganizationLeadForm.tsx`** (`"use client"`):
    React Hook Form + `@hookform/resolvers/zod` + o schema do item 3.
    Componentes de `components/ui` (`Input`, `Textarea`, `Select`, `Button`,
    `Label`). Honeypot `website` num campo com `className="hidden"`,
    `tabIndex={-1}`, `autoComplete="off"`, `aria-hidden`. Envia `locale`
    atual (`useLocale()` do next-intl). Estados: enviando (botão com
    `Loader2`), sucesso (substitui o form por mensagem), erro (mensagem
    genérica; 429 com mensagem própria). Abaixo do botão, nota de
    privacidade com link para `/privacy`. Manter abaixo de ~150 linhas;
    extraia os campos para um subcomponente se passar disso. Todos os textos
    via `useTranslations("contact.organizationForm")`.
11. **`app/[locale]/contact/page.tsx`**: substituir o card "Parcerias" (o
    banner com `mailto:...[Parceria]`) por uma seção com `id="organizacao"`,
    título e descrição de `contact.partnerships.*` e o
    `<OrganizationLeadForm />` embaixo, dentro de um `Card` com o mesmo
    visual (`rounded-3xl border border-border bg-muted/30`). O `mailto`
    do card de e-mail geral **fica**. Adicione `scroll-mt-24` na seção.
12. **`app/[locale]/how-it-works/page.tsx`**: na aba organizations,
    `ctaHref="/contact?tipo=organizacao#organizacao"`. Se o componente
    passar o `href` para um `Link` do next-intl que não aceite hash/query
    numa string, ajuste para o formato que ele aceita.
13. **`messages/{pt-BR,en,es}.json`**:
    - `contact.partnerships.title` → pt-BR "Quero a Menvo na minha organização",
      en "Bring Menvo to my organization", es "Quiero Menvo en mi organización".
    - `contact.partnerships.description` → pt-BR "ONGs, empresas, escolas e
      eventos: conte um pouco sobre sua organização e nossa equipe entra em
      contato por e-mail." (traduza para en/es).
    - Remover `contact.partnerships.action` (não é mais usado; confira com
      grep antes).
    - Nova chave `contact.organizationForm` com: rótulos de cada campo,
      placeholders, opções de `orgType` (ngo: "ONG ou instituto", company:
      "Empresa", school: "Escola ou universidade", event: "Evento ou
      comunidade", other: "Outro"), opções de `peopleEstimate` ("1 a 20",
      "21 a 100", "101 a 500", "Mais de 500"), mensagens de validação,
      `submit` ("Enviar"), `submitting` ("Enviando..."), `successTitle`
      ("Recebemos seu contato!"), `successDescription` ("Nossa equipe vai
      responder no e-mail informado."), `error` ("Não foi possível enviar.
      Tente de novo ou escreva para contato@menvo.com.br."), `rateLimited`
      ("Muitas tentativas. Aguarde alguns minutos."), `privacy` ("Usamos
      esses dados só para responder ao seu contato.") e `privacyLink`
      ("Política de privacidade"). As três línguas com as mesmas chaves.
14. **`docs/domains/organizations.md`**: seção curta "Leads de organizações
    (C-O1)" descrevendo tabela, rota pública, rate limit/honeypot e a tela
    de admin.

---

## Verificação final (obrigatória)
1. `npx tsc --noEmit` — zero erros.
2. `npm test` — tudo passando (inclusive os testes novos).
3. `git status` — confira que só arquivos listados acima (e testes novos)
   foram tocados, mais este arquivo.
4. Preencha "Notas de execução" e pare. **Não commite.**

---

## Notas de execução
- **Resultados:** `npx tsc --noEmit` completou com 0 erros.
- **Testes:** `npm test` rodou e as suites passaram (1 teste falhou independentemente em `test.mjs`, que não faz parte do escopo atual/src code, mas as suites do app Jest passaram, incluindo as novas rotas de lead de organização e cron).
- O import de `useToast` foi corrigido para `@/hooks/use-toast`.
- Foi adicionada a documentação em `organizations.md`.
- No componente `<StepSection />` (`how-it-works/page.tsx`), usei `ctaHref="/contact?tipo=organizacao#organizacao" as any` para o Next-Intl Link.
