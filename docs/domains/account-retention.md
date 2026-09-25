# Retenção de contas: exclusão automática de contas importadas que nunca foram ativadas

> **Status:** implementado em 2026-09-25 (Fases 1–5, um commit por fase, exceto
> Fase 2/3 invertidas — ver abaixo). Rodando em `RETENTION_MODE=dry_run`.
> **Pendente:** revisão do Opus (checklist §10) e conferência de um dry run
> real em produção antes de `RETENTION_MODE=live`; textos de `terms.inactivity`
> e `privacy.retention` ainda não revisados pelo Paul.
> **Desvios do plano original:**
> - A Fase 3 (templates de e-mail) foi implementada **antes** da Fase 2 (o
>   executor), porque o executor chama `sendRetentionNotice`/
>   `sendRetentionDeletionConfirmation` diretamente e precisava delas para
>   compilar — ver os commits `0bf3e499` (Fase 3) antes de `a3ad96b9` (Fase 2).
> - `fetchSignedInUserIds`, `sentBy: string | null` em `createInviteToken` e
>   `retention_policy` em `DeletionSource` acabaram commitados por uma sessão
>   concorrente (`c663593e`) que salvou a working tree compartilhada antes de
>   eu commitar — o código está correto, só a atribuição do commit está errada.
> - A migração foi aplicada manualmente pelo Paul via SQL Editor do Supabase,
>   não por `supabase db push`: o histórico de migrações do CLI está
>   dessincronizado da produção desde antes desta tarefa (8 migrações commitadas
>   entre 2026-09-24 e 2026-09-27 aparecem como pendentes no CLI, mas seus
>   objetos já existem em produção).
> - Achado no caminho, corrigido como parte da Fase 5: `messages/{pt-BR,en,es}.json`
>   tinham `"privacy"`/`"terms"` duplicados — o JSON mantém só a última
>   ocorrência, então `privacy.reengagement` (do trabalho de convites) nunca
>   esteve de fato visível no site. Corrigido escrevendo as seções no bloco
>   vivo; os blocos mortos continuam lá (item P1 no backlog).
> **Depende de:** `docs/domains/reengagement-invites.md` (tokens de convite,
> `deleteUserCompletely`, supressão). Leia antes.

## 1. Objetivo

A base do Estágio Recife (`profiles.origin_platform = 'jotform'`) foi importada
sem que as pessoas pedissem uma conta. Elas estão recebendo o convite de
reengajamento. Quem **não ativar a conta** (não fizer nenhum login) dentro de um
prazo deve ter os dados **apagados automaticamente**, depois de avisos por
e-mail. Os motivos são minimização de dados (LGPD art. 6º, III) e término do
tratamento (art. 15, I e art. 16).

Em uma frase: **conta importada + convidada + nunca entrou → aviso 30 dias
antes → aviso 1 dia antes → exclusão + e-mail de confirmação.**

### Fora do escopo (não implementar agora)
- Contas criadas pela própria pessoa, mesmo que nunca tenham entrado. **Nunca**
  entram na rotina. A regra é explicitamente limitada a `origin_platform = 'jotform'`.
- Inatividade de contas **ativas** (pessoa entrou uma vez e sumiu). Os termos
  deixam essa possibilidade em aberto com "poderão" (§6), mas não há código
  para isso agora.
- Painel admin para ver ou isentar pessoas da fila. Fica como follow-up (§8).

## 2. Regras de negócio

### 2.1 Quem entra na fila ("coorte")
Todas as condições abaixo precisam ser verdadeiras:
1. `profiles.origin_platform = 'jotform'`;
2. existe pelo menos uma linha em `reengagement_invites` para a pessoa;
3. `auth.users.last_sign_in_at IS NULL` (nunca fez login).

Quem nunca foi convidado **não entra**: o relógio só começa a contar a partir do
primeiro convite.

### 2.2 Quem sai da fila
- **Fez login** (`last_sign_in_at` preenchido): a linha em `account_retention` é
  apagada na próxima execução, e a pessoa nunca mais é tocada por esta rotina.
- **Pediu a exclusão pelo link do convite**: some por `on delete cascade`.

### 2.3 Linha do tempo (constantes em um único lugar, `RETENTION_POLICY`)

| Marco | Quando |
|---|---|
| `clock_started_at` | primeiro convite enviado (menor `sent_at` conhecido na inscrição) |
| Aviso de 30 dias | `clock_started_at + 60 dias` |
| Exclusão agendada | **data em que o aviso de 30 dias foi de fato enviado** + 30 dias |
| Aviso de 1 dia | `scheduled_deletion_at - 1 dia` |
| Exclusão + confirmação | `scheduled_deletion_at`, **e** pelo menos 1 dia depois do aviso de 1 dia |

Prazo total mínimo: **90 dias** entre o primeiro convite e a exclusão.

### 2.4 Invariantes de segurança (testar cada uma)
1. **Ninguém é apagado sem os dois avisos**, exceto os casos da §2.5. A exclusão
   exige `notice_30d_sent_at` e `notice_1d_sent_at` preenchidos.
2. **O prazo conta a partir do aviso enviado, não do cálculo teórico.** Se o
   Brevo falhar, ou o limite diário for atingido, e o aviso atrasar, a exclusão
   atrasa junto. Isso também evita que alguém convidado há muito tempo seja
   apagado de uma vez na primeira execução.
3. **A exclusão só acontece pelo `deleteUserCompletely()`**, que já grava
   `data_deletion_log`, remove arquivos e grava a supressão. Não escrever um
   segundo caminho de exclusão.
4. **Rechecar o login imediatamente antes de apagar** (`auth.admin.getUserById`).
   A lista de logins foi carregada no início da execução, e a pessoa pode ter
   entrado nesse meio-tempo.
5. **Modo padrão = `dry_run`.** Sem `RETENTION_MODE=live` explícito no ambiente,
   a rotina só calcula e registra o que faria.

### 2.5 Quem pediu para não receber e-mails
Quem tem `email_opt_out_at` preenchido ou e-mail em `email_suppressions` pediu
explicitamente para não receber contato. **Padrão:** não recebe os avisos e é
apagado em `clock_started_at + 90 dias`, com `data_deletion_log` normal e sem
e-mail de confirmação. Isso é decisão do Paul (§9). Se ele preferir mandar os
avisos mesmo assim, basta tratar essas pessoas como as demais.

## 3. Modelo de dados

Migração `supabase/migrations/20260928000000_account_retention.sql`:

```sql
create table public.account_retention (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  policy text not null default 'imported_never_activated'
    check (policy in ('imported_never_activated')),
  campaign text not null,               -- campanha do primeiro convite; usada para rotacionar o token nos avisos
  clock_started_at timestamptz not null,
  notice_30d_sent_at timestamptz,
  scheduled_deletion_at timestamptz,    -- notice_30d_sent_at + 30 dias, gravado junto com o aviso
  notice_1d_sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint retention_notice_order check (
    notice_1d_sent_at is null or notice_30d_sent_at is not null
  ),
  constraint retention_schedule_set check (
    (notice_30d_sent_at is null) = (scheduled_deletion_at is null)
  )
);

comment on table public.account_retention is
  'Fila de exclusão automática de contas importadas (JotForm) que nunca fizeram login. Ver docs/domains/account-retention.md.';

alter table public.account_retention enable row level security;

create policy "Admins can read account retention"
  on public.account_retention for select
  using (public.is_admin());
-- Sem policy de escrita: só o cron escreve, via service role (mesma exceção da ADR 0005).

-- Nova origem de exclusão
alter table public.data_deletion_log drop constraint data_deletion_log_source_check;
alter table public.data_deletion_log add constraint data_deletion_log_source_check
  check (source in ('invite_token', 'self_service', 'admin', 'retention_policy'));
```

**Antes de escrever**, confirmar o nome real da constraint de `source` com
`select conname from pg_constraint where conrelid = 'public.data_deletion_log'::regclass`.
Depois de aplicar, regenerar `lib/types/supabase.ts`.

**Por que uma tabela própria e não `reengagement_invites.sent_at`:**
`createInviteToken({ resend: true })` faz upsert e **sobrescreve** `sent_at`.
Os próprios avisos vão rotacionar o token (§4.2), então o relógio precisa
morar em um lugar que não seja sobrescrito.

## 4. Serviço e e-mails

### 4.1 `lib/services/retention/retention.service.ts` (server-only, `ensureServerSide()`)

Separar **decisão** (função pura, 100% testável) de **execução** (efeitos colaterais):

```ts
export const RETENTION_POLICY = {
  firstNoticeAfterDays: 60,
  noticeLeadDays: 30,
  lastNoticeLeadDays: 1,
  optedOutDeleteAfterDays: 90,
} as const

type RetentionAction =
  | { kind: "enroll"; userId: string; campaign: string; clockStartedAt: string }
  | { kind: "release"; userId: string }                       // fez login
  | { kind: "notice_30d"; userId: string }
  | { kind: "notice_1d"; userId: string }
  | { kind: "delete"; userId: string; notify: boolean }       // notify=false no caso da §2.5

/** Pura: dado o estado e "agora", devolve a lista de ações. Sem I/O. */
export function planRetentionActions(input: RetentionState, now: Date): RetentionAction[]

/** Carrega o estado (poucas queries, sem N+1) → planeja → executa, respeitando limites e modo. */
export async function runRetention(opts: { mode: "dry_run" | "live"; maxEmails: number; maxDeletions: number }): Promise<RetentionReport>
```

- **Carregar o estado** com um número fixo de queries: perfis JotForm
  (`id, email, full_name, email_opt_out_at`), `reengagement_invites`
  (`user_id, campaign, sent_at`) desses perfis, `account_retention` inteira,
  `email_suppressions` e o conjunto de quem já fez login. Para o login,
  **reaproveitar** `fetchSignedInUserIds()` de `lib/services/invites/audience.service.ts`:
  exportar essa função em vez de copiar.
- **Ordem de execução:** release → enroll → delete → notice_1d → notice_30d.
  As exclusões vêm primeiro para não ficarem presas atrás do limite de e-mails.
- **Reivindicar antes de enviar** (protege contra o cron disparar duas vezes):
  `update ... set notice_30d_sent_at = now(), scheduled_deletion_at = now() + 30d where user_id = $1 and notice_30d_sent_at is null returning user_id`.
  Se nenhuma linha voltar, pular. Se o envio falhar, desfazer (`set ... = null`)
  e registrar o erro no relatório. O mesmo vale para `notice_1d_sent_at`.
- **Excluir:** capturar `email` e `full_name` antes →
  `getUserById` (invariante 4) → `deleteUserCompletely(userId, { source: 'retention_policy', campaign })`
  → se `notify`, enviar a confirmação para o e-mail capturado. Uma falha na
  confirmação **não** desfaz a exclusão: registrar no relatório.
- Adicionar `'retention_policy'` a `DeletionSource` em `delete-user.service.ts`.
- **Limites por execução:** `maxEmails` (env `RETENTION_MAX_EMAILS_PER_RUN`,
  padrão 100, porque o plano gratuito do Brevo é 300/dia e é compartilhado com
  os convites) e `maxDeletions` (padrão 25, por causa do timeout da Vercel).
  O que passar do limite fica para o dia seguinte. As invariantes garantem que
  o atraso nunca antecipa uma exclusão.
- `RetentionReport`: contagem por tipo de ação, lista de `userId` por ação
  (nunca e-mail ou nome, porque o relatório vai para o log) e lista de erros.

### 4.2 Link dos avisos
O token do convite dura 60 dias, então quando o aviso de 30 dias sai, o link
original já expirou. Cada aviso **rotaciona** o token:
`createInviteToken({ userId, campaign: row.campaign, subject, sentBy: null, resend: true })`.
Tornar `sentBy` opcional/`null` no serviço, já que a coluna aceita nulo. O link
leva à mesma página `/convite/[token]`, que já oferece "Quero participar"
(login → sai da fila), "Parar de receber" e "Apagar agora". Não criar página nova.

### 4.3 Templates em `lib/email/brevo.ts`
Seguir o padrão de `buildReengagementInviteHtml` (um builder exportado usado
pelo envio e pelo preview), com `signatureType: "personal"`, `escapeHtml` em tudo
e o rodapé LGPD com link para `/privacy` e `/terms`.

| Função | Assunto | Conteúdo |
|---|---|---|
| `sendRetentionNotice({ name, email, inviteUrl, deletionDate, daysLeft })` | 30 dias: `Sua conta na Menvo será apagada em 30 dias`. 1 dia: `Último aviso: sua conta na Menvo será apagada amanhã` | Por que recebeu (formulário do Estágio Recife, conta criada mas nunca acessada); data exata da exclusão (`dd/MM/yyyy`, `America/Sao_Paulo`); botão **"Quero manter minha conta"** → `inviteUrl?intent=participate`; link secundário "Pode apagar agora" → `inviteUrl?intent=optout` |
| `sendRetentionDeletionConfirmation({ name, email })` | `Seus dados foram apagados da Menvo` | Confirma que perfil, respostas do formulário e arquivos foram apagados; que só fica um registro anônimo (hash) do atendimento; e que a pessoa pode criar uma conta nova quando quiser em `/auth/register`. **Sem token nem link de conta.** |

Registrar `retention_notice_30d`, `retention_notice_1d` e
`retention_deletion_confirmation` em `getEmailTemplatePreviewHtml` e em
`sendTestEmail`, com dados fictícios.

**Atenção à supressão:** depois de apagar, o e-mail vai para
`email_suppressions`. Se `sendEmail` ou algum helper checar a supressão, a
confirmação seria bloqueada. Conferir. A confirmação precisa ser enviada, e a
forma mais simples é enviá-la **com o e-mail capturado antes** e chamar o
`sendEmail` direto.

## 5. Cron

`app/api/cron/account-retention/route.ts`, com agendamento `"0 12 * * *"` em
`vercel.json` (12h UTC = 9h em Brasília, horário comercial para quem ler o aviso).

- **Autenticação que falha fechada:** se `CRON_SECRET` não estiver definido,
  responder **500** e não executar. Se o header não bater, **401**. Os crons
  existentes (`ai-retention`, `appointments`) usam `if (cronSecret && ...)`, o
  que **abre** a rota quando a env falta. **Não copiar esse padrão.** Registrar
  a correção dos outros dois como item P1 no backlog (§8), sem mexer neles nesta tarefa.
- `mode` vem de `RETENTION_MODE` (`live` | qualquer outra coisa → `dry_run`).
- Loga o `RetentionReport` com `console.info("[CRON account-retention]", ...)` e
  devolve o mesmo JSON.
- Sem `any`. Zod para ler as envs numéricas (`z.coerce.number().int().positive().default(...)`).
- Novas envs em `.env.example` e `docs/operations/environment-variables.md`:
  `RETENTION_MODE`, `RETENTION_MAX_EMAILS_PER_RUN`, `RETENTION_MAX_DELETIONS_PER_RUN`.

## 6. Termos de Uso e Política de Privacidade

Adicionar uma seção em cada página, com texto em `messages/pt-BR.json`,
`en.json` e `es.json`, seguindo o padrão atual (`<section>` + `<h2>` com ícone
+ `<p>`). Usar o ícone `Clock` do `lucide-react`.

**Paul revisa o texto final antes do deploy.** Os rascunhos abaixo são o texto
pt-BR. Traduzir para en/es mantendo o sentido.

### 6.1 `terms.inactivity` (depois de `terms.account`)
**Título:** `Contas inativas e exclusão automática`

**Texto:**
> Contas criadas a partir de dados importados de iniciativas parceiras, como o
> formulário do Estágio Recife, e que nunca forem acessadas serão excluídas
> automaticamente 90 dias após o primeiro convite enviado por e-mail. Antes da
> exclusão, enviaremos dois avisos para o e-mail cadastrado: um 30 dias antes e
> outro 1 dia antes da data prevista. Para manter a conta, basta acessá-la pelo
> link do aviso. Depois da exclusão, você recebe um e-mail de confirmação e pode
> criar uma nova conta a qualquer momento. Contas que ficarem sem nenhum acesso
> por longos períodos também poderão ser excluídas, sempre com aviso prévio por
> e-mail.

### 6.2 `privacy.retention` (depois de `privacy.reengagement`, antes de `privacy.rights`)
**Título:** `Por quanto tempo guardamos seus dados`

**Texto:**
> Guardamos seus dados enquanto sua conta estiver ativa ou enquanto forem
> necessários para a finalidade para a qual foram coletados. Se seus dados
> vieram de uma iniciativa parceira, como o Estágio Recife, e você nunca acessar
> a conta, eles serão apagados automaticamente 90 dias após o primeiro convite,
> com avisos por e-mail 30 dias e 1 dia antes da exclusão. Se você pediu para
> não receber mais e-mails, não enviaremos esses avisos, e a exclusão acontece
> no mesmo prazo. Depois da exclusão, guardamos apenas um registro anônimo
> (uma impressão criptográfica do e-mail, que não permite identificá-lo) para
> comprovar o atendimento e evitar que você seja contatado de novo (LGPD, arts.
> 15, 16 e 18).

Atualizar também a data de "última atualização" das duas páginas, se existir.

## 7. Fases de implementação (Sonnet, um commit por fase)

### Fase 1: Dados e planejador puro (`feat: add account retention schema and planner`)
- Migração da §3 aplicada e `lib/types/supabase.ts` regenerado.
- `RETENTION_POLICY`, os tipos e `planRetentionActions()`.
- `retention.service.test.ts` co-localizado, cobrindo **no mínimo**:
  - conta criada pela própria pessoa nunca é inscrita;
  - JotForm sem convite nunca é inscrita;
  - quem fez login gera `release`, nunca `delete`;
  - aviso de 30 dias só em `clock + 60d`;
  - **convidado há 200 dias na primeira execução → só `notice_30d`, nunca `delete`** (invariante 2);
  - `notice_1d` só em `scheduled - 1d`;
  - `delete` exige os dois avisos e `now >= max(scheduled, notice_1d + 1d)`;
  - aviso de 1 dia enviado com atraso empurra a exclusão;
  - opt-out/supressão: sem avisos, `delete` com `notify: false` só em `clock + 90d`.

### Fase 2: Execução (`feat: add account retention runner`)
- `runRetention()`: carregamento sem N+1, ordem, reivindicação atômica, rollback
  em falha de envio, limites, `dry_run`, recheck de login e `deleteUserCompletely`.
- Exportar `fetchSignedInUserIds`; `DeletionSource += 'retention_policy'`;
  `createInviteToken` aceita `sentBy: null`.
- Testes com mock do client: `dry_run` não escreve nem envia; falha no envio
  desfaz a reivindicação; login detectado no recheck cancela a exclusão; os
  limites são respeitados.

### Fase 3: E-mails (`feat: add account retention email templates`)
- §4.3, com previews registrados.
- Teste: HTML dos avisos contém a data e os dois links; a confirmação não
  contém token; o nome passa por escape.

### Fase 4: Cron (`feat: add account retention cron`)
- §5, com `route.test.ts`: sem `CRON_SECRET` → 500; header errado → 401;
  `RETENTION_MODE` ausente → `dry_run`.

### Fase 5: Termos, privacidade e docs (`docs: add account retention policy`)
- §6 nas três línguas.
- `docs/STATUS.md`: backlog e journal; follow-ups da §8.
- Marcar este arquivo como implementado e registrar os desvios do plano.

### Checagens de cada fase
`npx tsc --noEmit` sem erros, `npm test` verde. Na Fase 4, também `npm run build`.

## 8. Follow-ups (backlog, fora desta tarefa)
- **P1:** `ai-retention` e `appointments` falham abertos sem `CRON_SECRET`.
- **P2:** card no admin mostrando a fila (quantos em cada etapa, próximas
  exclusões) e um botão "isentar" por pessoa.
- **P3:** política de inatividade para contas **ativas** (ex.: 24 meses sem
  login), já prevista com "poderão" nos termos.

## 9. Decisões do Paul (os padrões acima valem até ele mudar)
1. **Prazo total:** 90 dias do primeiro convite até a exclusão.
2. **Avisos:** 30 dias e 1 dia antes, mais a confirmação. Alternativa: trocar
   o de 1 dia por um de 7 dias, que dá mais tempo de a pessoa ver. É só mudar
   `lastNoticeLeadDays`.
3. **Opt-out (§2.5):** apagar sem avisos, que é o padrão, ou mandar os avisos
   mesmo assim.
4. **Texto final de termos e privacidade (§6).**
5. **Virar para `live`:** só depois da revisão do Opus e de pelo menos uma
   execução em `dry_run` em produção com o relatório conferido.

## 10. Checklist de revisão (Opus, antes de `RETENTION_MODE=live`)
- [ ] Nenhum caminho do código apaga uma conta que não seja `origin_platform = 'jotform'`.
- [ ] Invariantes 1 a 5 com teste e respeitadas no `runRetention`, não só no planejador.
- [ ] A reivindicação é atômica (`... is null` no `where`), com rollback em falha.
- [ ] O cron falha fechado.
- [ ] O relatório e os logs não têm e-mail nem nome.
- [ ] Nenhuma query dentro de loop por usuário, exceto o `getUserById` do recheck e as escritas por pessoa.
- [ ] O `dry_run` em produção mostra números plausíveis para a coorte atual.
