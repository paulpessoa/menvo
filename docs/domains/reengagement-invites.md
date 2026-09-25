# Convites de reengajamento (base Estágio Recife / JotForm) + exclusão LGPD

> **Status:** planejado em 2026-09-24, não iniciado.
> **Executor previsto:** Sonnet, fase por fase, um commit (Conventional Commits) por fase.
> Leia `docs/STATUS.md` e `AGENTS.md` antes de começar.

## 1. Objetivo

Paul importou para `profiles` a base histórica do formulário do **Estágio Recife**
no JotForm (`profiles.origin_platform = 'jotform'`, respostas originais em
`profiles.original_data`). Essas pessoas nunca pediram uma conta na Menvo. Então
precisamos:

1. **Avisar e convidar:** explicar que a Menvo é uma extensão do Estágio
   Recife, convidar a pessoa a entrar e completar o perfil e, como muitos já
   se formaram, convidar também a ser **mentor(a)**.
2. **Dar uma saída fácil, com token, em conformidade com a LGPD:** um botão
   no e-mail que leva a uma página onde a pessoa pede, sem precisar de login,
   para **parar de receber e-mails** ou para **apagar os dados e o perfil**
   (LGPD art. 18, IV e VI).
3. **Usar a ferramenta com qualquer público:** um modal no admin que envia o
   convite para usuários selecionados, para toda a base JotForm, para quem
   nunca entrou ou para todos.

## 2. O que já existe (reaproveitar, não duplicar)

| Peça | Onde | Observação |
|---|---|---|
| Seleção em massa + botão "convidar" | `app/[locale]/dashboard/admin/users/page.tsx` (`handleBulkInvite`, ~L170) | Vai abrir o novo modal em vez de chamar o endpoint antigo |
| Endpoint antigo | `app/api/admin/users/invite-batch/route.ts` | Usa `resetPasswordForEmail`, que manda o e-mail **padrão do Supabase** com link de poucas horas. **Substituir** pelo novo fluxo e apagar |
| Filtro de origem JotForm | `app/api/admin/users/route.ts` (`origin=jotform`) | Mesma lógica usada para montar o público |
| Coluna `profiles.invite_sent_at` | já existe | Continuar preenchendo (o admin já usa) |
| Padrão de link mágico + template próprio | `app/api/admin/waiting-list/create-account/route.ts` | `generateLink({type:'recovery'})` → `/update-password`. **Leia o comentário do topo**: explica por que redirecionar direto para `/update-password` e não para `/auth/callback` |
| Layout de e-mail + `escapeHtml` + `sendEmail` | `lib/email/brevo.ts` | Novo template entra aqui, com `signatureType: 'personal'` |
| Preview/teste de templates | `getEmailTemplatePreviewHtml`, `app/api/admin/emails/preview`, `send-test` | Registrar o novo template como `reengagement_invite` |
| Exclusão pelo admin | `app/api/admin/users/[id]/route.ts` `DELETE` | Extrair para um serviço comum (Fase 3) |
| Guard de admin | `lib/auth/require-admin.ts` | Todas as rotas `/api/admin/*` novas |
| Rate limit | `lib/rate-limit.ts` | Rotas públicas do token |
| Frase da marca | `app/[locale]/mentors/page.tsx:413` | Usar **literalmente** no e-mail (ver §6) |

## 3. Decisões de arquitetura

### 3.1 Um token de longa duração, com uma página de destino própria
Links de recuperação do Supabase expiram em horas, e as pessoas vão abrir o
e-mail dias depois. Por isso o e-mail **não** carrega o link mágico do Supabase.
Carrega um token nosso, com 60 dias de validade, que leva para
`/[locale]/convite/[token]`. Ali a pessoa escolhe:

- **"Quero participar"**: POST no servidor, que gera **na hora** um
  `generateLink({type:'recovery'})` e redireciona para o `action_link`. A pessoa
  vai para `/update-password`, define a senha e segue para `/profile`.
- **"Quero ser mentor(a)"**: mesmo fluxo, com destino final no pedido de
  mentoria (`/api/profile/request-mentor` / tela correspondente; confirmar a rota
  de UI). Se `/update-password` não aceitar um `next`, adicionar esse suporte com
  allowlist de caminhos internos (evita open redirect).
- **"Não quero mais receber e-mails"**: grava `profiles.email_opt_out_at`.
- **"Apagar meus dados e meu perfil"**: tela de confirmação e exclusão
  definitiva (§3.3).

### 3.2 Nada destrutivo por GET
Scanners de e-mail (Outlook Safe Links, antivírus corporativos) abrem os links
automaticamente. **Abrir a página nunca muda estado.** Toda ação é um POST
disparado por clique. A exclusão pede uma segunda confirmação explícita
("Sim, apagar definitivamente").

### 3.3 Exclusão via service role: exceção justificada
`AGENTS.md` proíbe usar `service_role` como atalho em funcionalidade de usuário.
Aqui o uso é **necessário**, e não um atalho: a pessoa não tem sessão, e apagar
de `auth.users` só é possível pela Admin API. Para ficar dentro do espírito da
regra:
- a validação do token e a exclusão ficam **só** em
  `lib/services/invites/*.service.ts` (server-only, com `ensureServerSide()`);
- a rota pública só aceita `{ token }` e nunca um `userId`;
- o `user_id` vem **exclusivamente** do registro do token;
- a exclusão reaproveita o mesmo serviço usado pelo admin
  (`lib/services/admin/delete-user.service.ts`, extraído na Fase 3).

Registrar essa exceção em um ADR curto em `docs/governance/adr/`.

### 3.4 Token guardado só como hash
Gerar 32 bytes aleatórios (`crypto.randomBytes(32).toString('base64url')`) e
guardar **apenas** `sha256(token)`. Na busca, comparar o hash. O token em texto
só existe dentro do e-mail.

### 3.5 Lista de supressão sem PII
Depois de apagar alguém, uma nova importação do JotForm poderia recriar a
pessoa e mandar outro e-mail. Guardar `sha256(lower(trim(email)))` em
`email_suppressions`, o que não é dado pessoal legível (base: art. 16, I,
cumprimento de obrigação, para provar o atendimento do pedido e não recontatar).
O envio de convites, e qualquer script de import futuro, **pula** e-mails
suprimidos.

## 4. Modelo de dados (migração `supabase/migrations/2026092700000X_reengagement_invites.sql`)

```sql
-- Um convite por pessoa por campanha
create table public.reengagement_invites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  campaign text not null,                 -- ex.: 'estagiorecife-2026'
  token_hash text not null unique,
  subject text not null,                  -- snapshot do que foi enviado (prova de comunicação)
  sent_by uuid references public.profiles(id) on delete set null,
  sent_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '60 days',
  opened_at timestamptz,                  -- primeira vez que a página /convite/[token] foi aberta
  response text check (response in ('accepted','accepted_mentor','opted_out','deleted')),
  responded_at timestamptz,
  unique (user_id, campaign)
);

-- Registro de atendimento LGPD, sem PII (sobrevive à exclusão do perfil)
create table public.data_deletion_log (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  source text not null check (source in ('invite_token','self_service','admin')),
  campaign text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.email_suppressions (
  email_hash text primary key,
  reason text not null check (reason in ('deleted','opted_out')),
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email_opt_out_at timestamptz;

alter table public.reengagement_invites enable row level security;
alter table public.data_deletion_log   enable row level security;
alter table public.email_suppressions  enable row level security;
-- Admin: SELECT via is_admin() (ou helper equivalente já usado nas outras policies admin — conferir).
-- anon/authenticated: nenhuma policy. O acesso público passa só pelo serviço server-side (§3.3).
```

**Antes de escrever a migração, o Sonnet deve:**
- confirmar que **toda** FK para `profiles(id)`/`auth.users(id)` tem `on delete
  cascade` ou `set null`. Rodar uma query em `information_schema` /
  `pg_constraint` e listar as FKs sem ação. Se alguma bloquear a exclusão,
  corrigir na mesma migração;
- conferir o helper de admin usado nas policies existentes (grep `is_admin` nas
  migrações);
- depois de aplicar, regenerar `lib/types/supabase.ts`.

## 5. Fases de implementação

### Fase 1: Dados e serviço de tokens (`feat: add reengagement invite tokens`)
- Migração da §4.
- `lib/services/invites/invite-token.service.ts`: `createInviteToken`,
  `resolveInviteToken(token)` → `{ invite, profile } | { error: 'invalid' | 'expired' | 'used' }`,
  `markOpened`, `markResponse`. Zod em todas as entradas.
- `lib/services/invites/suppression.service.ts`: `hashEmail`, `isSuppressed`, `suppress`.
- Testes co-localizados (`*.test.ts`): hash e não-armazenamento do token em
  texto, expiração, token já usado, supressão.

### Fase 2: Template de e-mail (`feat: add reengagement invite email template`)
- Em `lib/email/brevo.ts`: `sendReengagementInvite({ name, email, subject, bodyParagraphs, inviteUrl })`.
- O **corpo** é editável pelo admin (texto simples; cada linha em branco vira um
  `<p>`, **sempre** passando por `escapeHtml`; placeholder `{{primeiro_nome}}`).
- A **parte fixa, que o admin não consegue remover**, é gerada pelo template:
  - botão principal "Acessar a Menvo e completar meu perfil" → `inviteUrl`;
  - link secundário "Quero apoiar como mentor(a)" → `inviteUrl?intent=mentor`;
  - bloco LGPD no rodapé (via `footerExtra`): origem dos dados, link "Não quero
    participar / apagar meus dados" → `inviteUrl?intent=optout`, link para
    `/privacy`, e-mail de contato do encarregado.
- Registrar `reengagement_invite` em `getEmailTemplatePreviewHtml` e em
  `sendTestEmail`.
- Teste: o HTML sempre contém o link de opt-out, mesmo com corpo vazio, e o
  texto do admin sai escapado.

### Fase 3: Serviço de exclusão compartilhado (`refactor: extract user deletion service`)
- `lib/services/admin/delete-user.service.ts`: `deleteUserCompletely(userId, { source, campaign? })`:
  1. lê o e-mail;
  2. grava `data_deletion_log` (requested_at);
  3. remove os arquivos do usuário no Storage (avatar, CV). Conferir buckets e
     paths em `app/api/upload`;
  4. `auth.admin.deleteUser(userId)`, com fallback de apagar `profiles` como
     hoje;
  5. `suppress(email, 'deleted')`;
  6. completed_at.
- `app/api/admin/users/[id]/route.ts` `DELETE` passa a chamar esse serviço (`source: 'admin'`).
- Testes do serviço (mock do client).

### Fase 4: Rotas (`feat: add invite send and response endpoints`)
**Admin** (`requireAdmin`, Zod):
- `POST /api/admin/invites/audience`: `{ audience: 'selected'|'jotform_not_invited'|'never_signed_in'|'all', userIds?, campaign }`
  → `{ total, eligible, skipped: { suppressed, optedOut, alreadyInvited } }`. Serve
  para mostrar a contagem antes do envio. "Nunca entrou" usa a mesma lógica que
  `app/api/admin/users/route.ts` já usa para isso; não inventar outra.
- `POST /api/admin/invites/preview`: `{ subject, body }` → `{ html }` com dados fictícios.
- `POST /api/admin/invites/send`: `{ campaign, subject, body, userIds: string[] (máx. 25), resend?: boolean }`
  → cria o token, envia e preenche `invite_sent_at`. É idempotente por
  `(user_id, campaign)`: sem `resend`, pula quem já recebeu. Com `resend`,
  **rotaciona** o token. Retorna o resultado de cada pessoa.
  Motivo do lote de 25: evitar timeout da função na Vercel. O modal chama em
  loop (Fase 5).
- `logAdminAction(..., 'bulk_action', { campaign, count })` em `lib/audit-logger.ts`.
- Apagar `app/api/admin/users/invite-batch/route.ts`.

**Públicas** (sem sessão, `checkRateLimit` por IP, só `{ token }`):
- `POST /api/invites/respond`: `{ token, action: 'accept'|'accept_mentor'|'opt_out' }`
  - `accept*` → `generateLink({type:'recovery', options:{ redirectTo: /update-password?next=... }})` → `{ redirectUrl }`
  - `opt_out` → `email_opt_out_at = now()`, `suppress(email,'opted_out')`
- `POST /api/invites/delete`: `{ token, confirm: true }` → `deleteUserCompletely(..., { source: 'invite_token' })`.
- Resposta genérica para token inválido/expirado (não revelar se um e-mail existe).

**Envio em geral:** fazer os outros e-mails "de relacionamento" respeitarem
`email_opt_out_at`. Transacionais, como agendamento e senha, continuam. Listar
em `brevo.ts` quais funções checam o opt-out.

### Fase 5: Modal do admin (`feat: add reengagement invite modal to admin users`)
`components/admin/invites/` (cada arquivo com menos de 150 linhas, JSDoc):
- `InviteCampaignModal.tsx` (Dialog), com passos:
  1. **Público**: radio `Selecionados (N) | Base JotForm ainda não convidada | Nunca entraram | Todos`,
     campo `campanha` (padrão `estagiorecife-2026`), checkbox "reenviar para quem já recebeu".
     Mostra a contagem de `/audience`, incluindo quantos foram pulados e por quê.
  2. **Mensagem**: `Input` do assunto e `Textarea` do corpo, pré-preenchidos com o
     texto da §6. Um aviso explica que os botões e o rodapé LGPD entram
     automaticamente.
  3. **Pré-visualização**: `<iframe srcDoc>` com o HTML de `/preview`,
     "Enviar teste para mim" (reusa `send-test` ou um parâmetro no `/preview`),
     e confirmação "Enviar para X pessoas".
  4. **Envio**: loop de lotes de 25 com barra de progresso, contadores de
     sucesso/falha, lista de falhas e botão para cancelar entre lotes.
- Estado do formulário com React Hook Form + Zod. Chamadas com TanStack Query
  (`useMutation`).
- Na página `admin/users`: o botão atual de convite em massa abre o modal com os
  selecionados. Adicionar também um botão "Convidar…" no topo que abre o modal
  sem seleção. Remover `handleBulkInvite`/`sendingInvites`.
- **Cota do Brevo:** mostrar um aviso no passo 4 quando o total passar do
  limite diário do plano (`BREVO_DAILY_LIMIT` no env, padrão 300 = plano
  gratuito). Documentar em `docs/operations/environment-variables.md` e
  `.env.example`.

### Fase 6: Página pública `/[locale]/convite/[token]` (`feat: add public invite response page`)
- Server Component: `resolveInviteToken` + `markOpened`. Estados: válido,
  inválido/expirado (com link para login e "esqueci a senha"), já respondido.
- Mostra o primeiro nome, um texto curto e 4 ações (§3.1). Um client component
  pequeno trata os POSTs.
- `?intent=mentor|optout` só **destaca** a opção correspondente e **nunca**
  executa nada sozinho (§3.2).
- A exclusão tem uma segunda tela: lista o que será apagado (perfil, respostas
  importadas do formulário, contas de acesso, arquivos) e o que fica (registro
  anônimo do atendimento, §3.5). Botão "Apagar definitivamente".
- Tela de sucesso da exclusão confirmando que foi feito, sem pedir mais nada.
- `robots: noindex`. Textos em `messages/pt-BR.json`, `en.json` e `es.json` (namespace `invite`).
- Conferir se o middleware/rotas protegidas não bloqueiam `/convite` para anônimos.

### Fase 7: Documentação e LGPD (`docs: document reengagement invites and deletion`)
- Atualizar `/privacy` (`app/[locale]/privacy`) com: origem dos dados do Estágio
  Recife, finalidade, base legal (legítimo interesse, art. 7º IX, para o
  contato inicial), como pedir exclusão e o contato do encarregado. **Paul
  revisa esse texto antes do deploy.**
- ADR da exceção de service role (§3.3).
- `docs/STATUS.md`: item no backlog e entrada no journal.
- Follow-up no backlog (fora deste escopo): implementar a exclusão self-service
  em `/settings` (hoje é um `TODO` em `handleDeleteAccount`), reusando
  `deleteUserCompletely(..., { source: 'self_service' })`.

## 6. Texto padrão do e-mail (pré-preenchido no modal, editável)

**Assunto:** `Novidade: o Estágio Recife agora tem mentoria (e você faz parte)`

**Corpo:**

```
Olá, {{primeiro_nome}}!

Tenho uma novidade. Você preencheu o formulário do Estágio Recife, e agora criamos a Menvo como uma extensão dele: uma plataforma gratuita de mentoria de carreira, onde quem está começando conversa com profissionais que já passaram pelo mesmo caminho.

Seus dados do formulário já estão lá. Falta só entrar, conferir e completar seu perfil.

E se você já se formou (é bem provável!), queremos muito ter você do outro lado também, como mentor ou mentora. Uma conversa sua pode mudar o rumo de alguém que está exatamente onde você esteve.

Um recado sincero: toco a Menvo de forma voluntária, nas horas vagas. Estamos refatorando a plataforma para dar vazão aos matches entre mentores e mentorados, então alguma coisa ainda pode estar em construção. Se não encontrar um mentor para o que você precisa, é só responder este e-mail que a gente te ajuda a achar.

Você não precisa saber quem pode te ajudar, você só precisa saber o que quer conversar.

Um abraço,
Paul
```

Os botões e o rodapé LGPD entram automaticamente pelo template (Fase 2).
Rodapé sugerido: *"Você está recebendo este e-mail porque preencheu o
formulário do Estágio Recife. Se não quiser participar, [clique aqui] para
parar de receber e-mails ou apagar seus dados e seu perfil. Leia nossa
[Política de Privacidade]."*

## 7. Checklist de verificação (antes de dar a feature como pronta)
- [ ] `npx tsc --noEmit` sem erros, `npm test` verde, `npm run build` ok.
- [ ] Envio de teste para o próprio Paul: o e-mail chega, os links funcionam
      no celular e o rodapé LGPD aparece.
- [ ] Token de teste: abrir a página não muda nada no banco (conferir `response` nulo).
- [ ] "Quero participar": chega em `/update-password`, a senha funciona, cai
      em `/profile`.
- [ ] "Apagar": o usuário some de `auth.users` e `profiles`, os arquivos somem
      do Storage, a linha fica em `data_deletion_log` e o hash em
      `email_suppressions`. Reenviar a campanha pula essa pessoa.
- [ ] Token expirado ou adulterado: mensagem genérica.
- [ ] Rate limit das rotas públicas funcionando.
- [ ] Primeiro envio real: um lote pequeno (ex.: 20 pessoas). Acompanhar
      bounces e spam no Brevo antes de mandar para a base toda.

## 8. Pontos que precisam de decisão do Paul
- **E-mail de contato do encarregado (LGPD)** para o rodapé e para `/privacy`.
- **Plano do Brevo / limite diário:** define se a base inteira vai em um dia ou em vários.
- **Validade do token:** 60 dias por padrão.
