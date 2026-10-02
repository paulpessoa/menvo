# Verificação de Mentores

> Consolida o que antes eram quatro colunas de `profiles` contando a mesma
> história de jeitos diferentes, escritas por três telas admin que
> divergiam entre si. Ver migração `20260925000000_profiles_verification_single_source.sql`
> e o journal de 2026-09-25 em [`docs/STATUS.md`](../STATUS.md).
>
> **Fase 2 de [`profiles-schema.md`](profiles-schema.md) (2026-10-02):** a
> verificação e os campos só de mentor saíram de `profiles` para
> `mentor_profiles` (1:1). `verified`/`is_pending_mentor` deixaram de ser
> colunas e são calculados de `verification_status`. Migrations
> `20261004000000_mentor_profiles_expand.sql` e `..._contract.sql`.

## Modelo

| Conceito | Onde vive | Notas |
|---|---|---|
| "É mentor" | `user_roles` (role `mentor`) | Fonte de verdade para `isMentor` em todo o app (dashboard, `mentors_view`, RBAC). Usuário não grava papel: só o servidor (service role) e `handle_new_user`. |
| Candidatura a mentor | `mentor_profiles.verification_status` | `pending` \| `approved` \| `rejected` \| `NULL` (desistiu). **Única** fonte da verificação. Sem linha em `mentor_profiles` = nunca pediu. Mentorado não tem verificação. |
| Pendente / verificado | calculado | `is_pending_mentor = status = 'pending'`, `verified = status = 'approved'`, em `mentors_view` e em `withMentorFields` (`lib/services/mentors/mentor-profile-fields.ts`), que as rotas usam para devolver o perfil no formato de antes. |
| Notas do admin | `mentor_profiles.verification_notes` | Sem grant para `anon`/`authenticated`: só o service role lê/grava. |
| Aparece em `/mentors` | role `mentor` **+** `is_public = true` **+** `expertise_areas`/`mentorship_topics` preenchidos | Os três precisam ser verdadeiros ao mesmo tempo (`mentors_view`, filtrada por `is_public` e `mentor_skills is not null`). A aprovação liga `is_public`; o mentor pode desligar depois em `/profile`. |

### Quem muda o status
- **Usuário:** só por RPC (`security definer`), nunca por UPDATE: `request_mentor_verification()` (cria/volta para `pending`; quem já está `approved` continua) e `withdraw_mentor_verification()` (status `NULL`, usado por `/api/profile/stop-mentor`). As colunas de verificação não têm grant de escrita para usuários.
- **Admin:** só por `processVerification()` (abaixo), com service role.
- O usuário edita os campos de conteúdo do próprio registro (`mentorship_approach`, `inclusive_tags`, `chat_enabled`...) via `/api/profile` (PUT), que separa o payload com `splitMentorFields`.

Um candidato **fica com role `mentee`** até ser aprovado - só ganha `mentor`
na aprovação. Por isso a aba "Aguardando" filtra por
`mentor_profiles.verification_status = 'pending'`, nunca por role.

## Único caminho de decisão

Toda aprovação/rejeição passa por `processVerification()`
(`lib/services/verifications/notification.service.ts`), exposto em
`POST /api/admin/verify`. Ele faz, em uma chamada:

1. Grava a decisão em `mentor_profiles` (status, notas, `verified_at`) com o
   service-role client e toca `profiles` (a policy de UPDATE de `profiles` é
   só `auth.uid() = id` - a sessão do próprio admin não alcança o perfil de
   outra pessoa; usar o client normal faz o UPDATE "funcionar" sem erro e não
   tocar em nenhuma linha).
2. Na aprovação: concede a role `mentor` e remove `mentee` (mutuamente
   exclusivas), e publica o perfil (`is_public = true`).
3. Envia a mensagem no chat (texto padrão ou o rascunho/edição do admin).
4. Envia o e-mail transacional (Brevo), quando `notifyEmail` não é `false`.

Duas telas usam esse endpoint:

- **`/dashboard/admin/verifications`** - fila dedicada, com rascunho por IA
  (`MentorReviewAssistant` → `POST /api/admin/verifications/draft`).
- **`/dashboard/admin/users`** - modal de edição de usuário
  (`MentorApplicationPanel`), para decidir sem sair da ficha da pessoa.

Não existe um terceiro caminho. O POST de `/api/admin/mentors` e a ação
`toggle_verification_legacy` de `/api/admin/users/actions` foram removidos na
Fase 2 (gravavam a verificação direto, sem papel nem aviso). `VerificationService.completeVerification`
e `.setMentorVerification` (client-side, sem service-role) e a tela antiga
`/dashboard/admin/users/manage` (aposentada, agora redireciona) ficaram
`@deprecated` de propósito - nunca reative-os.

## Números do painel admin

`/dashboard/admin` (cards), a aba "Aguardando" de `/dashboard/admin/users`
e a fila de `/dashboard/admin/verifications` usam o mesmo endpoint,
`GET /api/admin/stats`, para que o número do card bata com o que aparece
ao clicar em "Acessar".

## Onde cada papel age

| Quem | Onde | O quê |
|---|---|---|
| Candidato a mentor | `/profile` → aba de solicitação | Pede para virar mentor (`POST /api/profile/request-mentor` ou `/api/profile/role`, ambos chamam `request_mentor_verification()`). Fica `mentee` + `mentor_profiles.verification_status='pending'` até a decisão. |
| Mentor aprovado | `/profile` | Controla a própria visibilidade (`is_public`) e dados públicos. |
| Admin | `/dashboard/admin/verifications` | Fila de candidaturas pendentes, com assistente de IA para rascunhar a mensagem. |
| Admin | `/dashboard/admin/users` | Ficha completa de qualquer usuário - edição de perfil, papéis, e o mesmo painel de aprovação (`MentorApplicationPanel`) para decidir sem trocar de tela. |
