# Verificação de Mentores

> Consolida o que antes eram quatro colunas de `profiles` contando a mesma
> história de jeitos diferentes, escritas por três telas admin que
> divergiam entre si. Ver migração `20260925000000_profiles_verification_single_source.sql`
> e o journal de 2026-09-25 em [`docs/STATUS.md`](../STATUS.md).

## Modelo

| Conceito | Onde vive | Notas |
|---|---|---|
| "É mentor" | `user_roles` (role `mentor`) | Fonte de verdade para `isMentor` em todo o app (dashboard, `mentors_view`, RBAC). |
| Candidatura a mentor | `profiles.verification_status` | `NULL` (nunca pediu) \| `pending` \| `approved` \| `rejected`. **Única** coluna que qualquer tela deve escrever diretamente. |
| Espelho de leitura | `profiles.is_pending_mentor` | Derivado por trigger (`sync_profile_verification_flags`) de `verification_status = 'pending'`. Não escrever direto. |
| Selo público | `profiles.verified` / `verified_at` | Ligado automaticamente pelo mesmo trigger quando `verification_status` vira `approved`. |
| Aparece em `/mentors` | role `mentor` **+** `is_public = true` **+** `expertise_areas`/`mentorship_topics` preenchidos | Os três precisam ser verdadeiros ao mesmo tempo (`mentors_view`, filtrada por `is_public` e `mentor_skills is not null`). A aprovação liga `is_public`; o mentor pode desligar depois em `/profile`. |

Um candidato **fica com role `mentee`** até ser aprovado — só ganha `mentor`
na aprovação. Por isso a aba "Aguardando" filtra por
`verification_status = 'pending'`, nunca por role.

## Único caminho de decisão

Toda aprovação/rejeição passa por `processVerification()`
(`lib/services/verifications/notification.service.ts`), exposto em
`POST /api/admin/verify`. Ele faz, em uma chamada:

1. Atualiza `profiles` com o service-role client (a policy de UPDATE de
   `profiles` é só `auth.uid() = id` — a sessão do próprio admin não
   alcança o perfil de outra pessoa; usar o client normal faz o UPDATE
   "funcionar" sem erro e não tocar em nenhuma linha).
2. Na aprovação: concede a role `mentor` e remove `mentee` (mutuamente
   exclusivas), e publica o perfil (`is_public = true`).
3. Envia a mensagem no chat (texto padrão ou o rascunho/edição do admin).
4. Envia o e-mail transacional (Brevo), quando `notifyEmail` não é `false`.

Duas telas usam esse endpoint:

- **`/dashboard/admin/verifications`** — fila dedicada, com rascunho por IA
  (`MentorReviewAssistant` → `POST /api/admin/verifications/draft`).
- **`/dashboard/admin/users`** — modal de edição de usuário
  (`MentorApplicationPanel`), para decidir sem sair da ficha da pessoa.

Não existe um terceiro caminho. `VerificationService.completeVerification`
e `.setMentorVerification` (client-side, sem service-role) e a tela antiga
`/dashboard/admin/users/manage` (aposentada, agora redireciona) ficaram
`@deprecated` de propósito — nunca reative-os.

## Números do painel admin

`/dashboard/admin` (cards), a aba "Aguardando" de `/dashboard/admin/users`
e a fila de `/dashboard/admin/verifications` usam o mesmo endpoint,
`GET /api/admin/stats`, para que o número do card bata com o que aparece
ao clicar em "Acessar".

## Onde cada papel age

| Quem | Onde | O quê |
|---|---|---|
| Candidato a mentor | `/profile` → aba de solicitação | Pede para virar mentor (`POST /api/profile/request-mentor` ou `/api/profile/role`). Fica `mentee` + `verification_status='pending'` até a decisão. |
| Mentor aprovado | `/profile` | Controla a própria visibilidade (`is_public`) e dados públicos. |
| Admin | `/dashboard/admin/verifications` | Fila de candidaturas pendentes, com assistente de IA para rascunhar a mensagem. |
| Admin | `/dashboard/admin/users` | Ficha completa de qualquer usuário — edição de perfil, papéis, e o mesmo painel de aprovação (`MentorApplicationPanel`) para decidir sem trocar de tela. |
