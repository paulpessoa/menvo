# Audit do domínio admin (14 camadas)

> Modo `audit` + `plan`: só leitura, nenhum código mudou. Data: 2026-10-20.
> Legenda: **ok** = cumpre a regra da camada; **parcial** = existe mas foge da
> regra; **falta** = não existe. A coluna "Prova" é o arquivo que sustenta o estado.

Escopo lido: `app/api/admin/**` (34 rotas, 11 com `route.test.ts`),
`lib/services/admin/`, `lib/services/verifications/`, `lib/services/invites/`,
`lib/services/organizations/org-leads.service.ts`,
`lib/services/appointments/admin-appointments.service.ts`, `lib/auth/require-admin.ts`,
`lib/audit-logger.ts`, `components/admin/**`, `app/[locale]/dashboard/admin/**`
e as migrations que citam `is_admin()`.

Números conferidos hoje: 19 rotas chamam `.from()` direto; 9 importam
`service_role` na própria rota (3 de appointments, `invites/send`, `overview`,
`retention`, `retention/exempt`, `feature-flags`, `users/[id]`); 14 de 34 usam Zod;
**7 rotas não têm nenhum chamador** no app (seção de achados).

## Camada × estado

| # | Camada | Estado | Prova |
|---|---|---|---|
| 1 | Migration SQL | **parcial** | `is_admin()` e as policies de admin existem e são usadas: `account_retention`, `inactive_accounts_queue` (`20261001000001`), `import_records` (`20261003010000`), `activity_logs` (`20261007020000`), `mentor_profiles` e `mentee_profiles` (`…0004`, `…0005`), `organizations` (`20260921000000`), `user_roles` (policy de admin mantida em `20261003030000`). **Faltam em migration:** policies de `feature_flags`, `feature_flag_audit_logs`, `admin_audit_logs`, e o SELECT de admin em `appointments`; existem em produção mas não estão versionadas (o mesmo problema de `user_favorites` no ADR 0008). `profiles` não tem UPDATE de admin (comentário em `notification.service.ts:55`), por isso a rota usa `service_role`. |
| 2 | Tipos gerados | **ok** | As tabelas do admin estão em `lib/types/supabase.ts` (`is_admin` na linha 2712). Os `as any` das rotas são resíduo: `organizations`, `organization_members` e `organization_leads` já têm tipo. A rota morta `resolve-migration-conflict` usa `user_migrations`, que **não existe** nem em migration nem nos tipos. |
| 3 | Entity | **falta** | Não há `lib/domain/admin/`. `lib/services/admin/admin.service.ts` guarda só `AdminUserUpdate`, interface escrita à mão e duplicada do schema da rota `users/[id]`. `users/route.ts` define `ProfileWithRoles` inline. |
| 4 | Zod | **parcial** | 14 de 34 rotas. Têm: `users/[id]` (schema inline na rota, não em `lib/schemas`), `verify`, `verifications/draft`, `invites/*`, `appointments/*` (`lib/schemas/appointment.ts`), `organizations*`. Sem Zod: `users` (page/limit/search via `parseInt`), `feature-flags` (body cru), `retention/exempt` (`userId` sem validar), `feedbacks`, `reports`, `mentors`, `overview`, `activity-logs`. `verify` aceita `userId: z.string().min(1)`, não UUID. Nenhuma rota valida a saída. |
| 5 | Repository | **falta** | Nenhum `lib/repositories/admin-*`. 19 rotas com `.from()` direto, e `lib/audit-logger.ts`, `overview.service.ts`, `activity-logs.service.ts`, `notification.service.ts`, `org-leads.service.ts` e `audience.service.ts` também. Reusáveis: `organizations.repository.ts`, `user-roles.repository.ts`, `appointments.repository.ts`. |
| 6 | Ports | **parcial** | E-mail por função direta de `lib/email/brevo.ts` em `invites/send`, `feedbacks`, `notify-verification`, `admin-appointments.service.ts` (sem interface). Já existe adapter de e-mail e Calendar de appointments (`lib/ports/adapters/appointment-*.ts`) que o `admin-appointments.service` poderia receber por parâmetro. IA de revisão de mentor passa pelo registro de modelos (ok). |
| 7 | Service | **parcial** | Há services de verdade: `admin-appointments.service.ts` (597 linhas, recebe o client por parâmetro e tem teste), `overview.service.ts`, `delete-user.service.ts`, `notification.service.ts`, `audience.service.ts`. Mas: (a) **nenhum confere o ator**: `admin-appointments.service.ts:18` diz "NUNCA chame isto sem requireAdmin antes", e `processVerification` confia no `adminId` que a rota passa (ADR 0008 §2.3 exige a conferência no service); (b) `users`, `users/[id]` PATCH, `feature-flags`, `retention`, `feedbacks`, `reports`, `organizations` não têm service, a regra mora na rota; (c) `notification.service.ts`, `delete-user.service.ts`, `org-leads.service.ts` e `audience.service.ts` criam o client `service_role` dentro do service, não numa composition. |
| 8 | Route handler | **parcial** | Todas as 34 conferem admin (30 por `requireAdmin`, 4 por cópia inline do mesmo código). Fogem do "fino": `users/[id]` (154), `users` (188), `feature-flags` (135), `retention` (87), `feedbacks`, `reports`, `stats`. Erro → status é feito à mão e várias devolvem `error.message` do banco ao cliente (`feature-flags`, `retention`, `users/[id]`). Só 5 rotas gravam `logAdminAction`. |
| 9 | OpenAPI | **falta** | Não há `lib/openapi/paths/admin.ts` (existem `appointments`, `me`, `mentors`, `org`, `profile`, `quiz`, `legal`). Ver decisão: não publicar admin no spec público. |
| 10 | Query layer | **falta** | Não há `lib/query/keys/admin*.ts` nem `hooks/admin*/`. As páginas e os componentes que falam com a API usam `fetch` em `useEffect` (`users/page.tsx:100`, `verifications/page.tsx:69,92`, `EditUserModal.tsx:87,128`, `AdminAppointmentsManager.tsx`). Efeito cruzado sem mapa: aprovar mentor em `/verifications` não invalida a lista de usuários nem o catálogo `qk.mentors`. |
| 11 | Página e componentes | **parcial** | Acima de ~150 linhas: `AdminAppointmentsManager` 653, `EditUserModal` 589, `verifications/page` 502, `emails/page` 385, `users/page` 384, `retention/page` 352, `feature-flags/page` 349, `UserMetrics` 224, `AdminFeedbackModeration` 214, `MentorApplicationPanel` 170, `MentorReviewAssistant` 157. Já bons: `overview/` (componentes pequenos, dados vindos de `getAdminOverview`), `invites/` (5 passos), `organizations/`. Nenhum componente fala com o Supabase direto (conferido). |
| 12 | Testes | **parcial** | 11 rotas com teste (`appointments` ×3, `audit-logs`, `emails` ×2, `invites` ×3, `org-leads`, `verifications/draft`), mais os services `delete-user`, `overview.aggregate`, `admin-appointments`, `notification`, `audience`, `invite-token`, `suppression`, `org-leads`. **Sem teste:** `users` (3 rotas, as de maior risco), `verify`, `feature-flags`, `retention` ×2, `feedbacks`, `reports`, `organizations` ×3, `mentors`. Sem pgTAP de admin (nenhum arquivo em `supabase/tests/` testa o que `is_admin()` libera). Componentes: só `AdminAppointmentsManager.test.tsx`. E2E: `smoke.spec.ts` não toca o admin. |
| 13 | Tooling e CI | **n/a** | É do repositório. |
| 14 | Superfície para agentes | **falta (negar)** | Sem capability de admin em `lib/agents/capabilities/` (só `appointments`). Recomendado manter assim: ações de admin com efeito de escrita não devem ir para MCP nem assistente. |

## Inventário de `service_role`

A regra do ADR 0008 (E7): painel admin aceito, mas só em `*.composition.ts`, nunca na
rota, com o service conferindo `is_admin` antes. Hoje **nenhum** ponto cumpre as duas
partes. Ver também o ADR 0008 §2.

| Rota / arquivo | Onde nasce o client hoje | Razão | Destino |
|---|---|---|---|
| `appointments` GET | rota (`createServiceRoleClient`) | Lê sessões de qualquer usuário com embed de `profiles` (e-mail) | **E7**, mas só depois de provar por pgTAP se `appointments` tem SELECT de admin; se tiver, a leitura passa para a sessão |
| `appointments/[id]/cancel` | rota | Escreve em sessão de terceiros, lê contato (E3) e apaga evento do Calendar | **E7** (token do e-mail e contato não vão para a sessão) |
| `appointments/[id]/resend` | rota | Gera novo token e reenvia e-mail ao mentor (E3 + E5) | **E7** |
| `invites/send` | rota | Lê `profiles` de quem não é o admin e **escreve** `import_records` (por desenho só `service_role` escreve) | **E7** |
| `invites/audience`, `preview` | `audience.service.ts` (`createServiceRoleClient` dentro do service) | Mesma leitura de `profiles`/`import_records`/`reengagement_invites`/`email_suppressions` | **E7**, mas mover para composition |
| `overview` | rota passa `createServiceRoleClient()` ao service | `appointments` (todas as linhas) e `inactive_accounts_queue` | `inactive_accounts_queue` **dá para trocar**: já tem policy `is_admin()`. `appointments` igual ao `GET appointments` acima |
| `retention` GET | rota | Lê `account_retention`, `inactive_accounts_queue` e `profiles` | **Dá para trocar pela sessão**: as duas filas têm policy `is_admin()` e `profiles` tem "Admins can view all profiles". Zero migration |
| `retention/exempt` | rota | Escreve `import_records` (só `service_role`) e apaga `account_retention` | **E7**; uma RPC `admin_exempt_retention(user)` tiraria o privilégio (migration, fica como M-A2 da decisão D4) |
| `feature-flags` GET/POST/PATCH/DELETE | rota, com `createClient(... SERVICE_ROLE_KEY)` direto de `process.env` (nem passa pelo `service-role.ts`) | "bypass RLS nas ações administrativas" | **Dá para trocar** pela sessão com `is_admin()`, mas as policies de `feature_flags` não estão versionadas. Primeiro migration/pgTAP, depois troca. Até lá E7 em composition |
| `users/[id]` PATCH | rota, mesmo `createClient` direto | `profiles` sem UPDATE de admin; `mentee_profiles` e `user_roles` **têm** policy de admin | `mentee_profiles` e `user_roles` dá para trocar pela sessão. `profiles` fica **E7** até policy ou RPC (D4) |
| `users/[id]` DELETE → `delete-user.service.ts` | service | `auth.users` só se apaga pela Admin API | **Permanente** (mesma razão do E1), mover o client para composition |
| `verify` → `notification.service.ts` | service | Escreve `user_roles` e `profiles` de terceiros | **E7**; `user_roles` já aceitaria a sessão de admin, `profiles` não |
| `org-leads` POST (público, fora de `/admin`) | `org-leads.service.ts` | E8 do ADR 0008 | Fora desta linha |

Resumo: dos 12 pontos, **2 saem direto** (`retention` GET, `overview` fila de
inativos), **3 saem depois de uma prova pgTAP** (`overview`/`appointments` leitura,
`feature-flags`, `users/[id]` partes de `user_roles`/`mentee_profiles`) e o resto fica
E7. Mais importante que trocar: **mover para composition** os 12.

## Achados de segurança

Nenhuma rota admin está sem checagem de admin: as 34 conferem (30 com `requireAdmin`,
4 com cópia inline). Os achados abaixo são de profundidade, não de porta aberta.

1. **Alto, endpoint vivo sem uso: `POST /api/admin/users/actions`.** Gera a senha
   temporária com `Math.random` (não criptográfico), **devolve a senha no corpo da
   resposta**, chama `supabase.auth.admin.updateUserById` com o client da sessão (a Admin
   API exige `service_role`, então hoje falha em 500) e `bulk_role_change` apaga **todos**
   os papéis de qualquer lista de ids, inclusive do próprio admin e de outros admins, sem
   Zod e sem limite. Zero chamadores. **Apagar.**
2. **Médio, `users/[id]` PATCH:** concede ou revoga papel (inclusive `admin`) **sem
   `logAdminAction`**; só 5 rotas gravam auditoria (appointments cancel/resend, invites/send,
   users/actions, users/manage). Troca de papel é "apaga tudo, depois insere": se o insert
   falha, a pessoa fica sem nenhum papel; o admin pode tirar o próprio papel (só o DELETE
   bloqueia o próprio id). A causa de fundo é a falta de `unique(user_id, role_id)` e de
   uma RPC atômica (M1 do ADR 0008).
3. **Médio, o service não confere o ator.** `admin-appointments.service`,
   `processVerification`, `deleteUserCompletely` e `audience.service` rodam com
   privilégio total e confiam que a rota chamou `requireAdmin`. Hoje ninguém chama sem o
   guard, mas é exatamente o padrão que gerou o bug do `cancel` (ADR 0008 §1).
4. **Médio, client `service_role` sem a proteção do helper** em `feature-flags` e
   `users/[id]`: constroem `createClient(url, SERVICE_ROLE_KEY)` na mão, pulando o
   `ensureServerSide()` de `lib/utils/supabase/service-role.ts`, e `users/[id]` nem tipa o
   client (`createClient` sem `<Database>`, por isso o `as any`). Além disso há um segundo
   factory (`lib/utils/supabase/admin.ts`, usado em `mentee/[slug]/page.tsx`).
5. **Baixo, `moderator` x `is_admin()`.** `requireAdmin(["admin","moderator"])` libera
   `users` GET, `stats`, `emails/preview` e `feature-flags` GET. Em `users` a leitura vai
   pela **sessão**, e as policies usam `is_admin()`; se `is_admin()` só reconhece `admin`,
   o moderador recebe lista vazia (falha silenciosa), e se reconhecer `moderator` ele vê
   e-mail e CV de todos. Precisa de um teste que diga qual dos dois é o desejado (D3).
6. **Baixo, código morto com superfície:** 7 rotas sem chamador no app, e2e, hooks ou
   scripts (`audit-logs`, `audit-logs/stats`, `notify-verification`,
   `resolve-migration-conflict`, `stats`, `users/actions`, `users/manage`). A
   `resolve-migration-conflict` escreve em `user_migrations`, tabela que não existe.
   Superfície a menos é segurança de graça. (A `audit-logs` é a única leitura da trilha
   `admin_audit_logs`, tem teste; ver D2.)
7. **Baixo, `error.message` do banco devolvido ao cliente** em `feature-flags`,
   `retention`, `users/[id]` e nas rotas de organizations. Vaza nome de coluna e de
   constraint para quem tiver a sessão de admin; troca para mensagem fixa no grupo de cada
   rota.
8. **Baixo, entrada sem validar:** `retention/exempt` (`userId` livre), `feature-flags`
   (body cru em POST/PATCH), `verify` (`userId` não UUID), `users` GET (`limit` sem teto:
   `parseInt(limit)` direto no `.range`). Cada uma fecha no grupo de Zod da sua linha.

## Decisões suas antes de começar

| # | Decisão | Por que trava | Minha sugestão |
|---|---|---|---|
| D1 | Quem confere admin: manter só `requireAdmin` na rota ou o **service também** chamar `is_admin()` antes de usar o privilégio | O ADR 0008 §2.3 pede no service; custa um RPC a mais por chamada e uma função compartilhada pelas duas linhas | Service confere. Uma função `assertAdmin(db)` no PR 0 (`rpc("is_admin")` com a sessão), usada por todos os services admin; a rota continua usando `requireAdmin` só para 401/403. O teste modelo é o do `cancel` ("não-admin recusado") |
| D2 | Apagar as 7 rotas sem chamador | Ponto de parada: apagar arquivo que não foi criado nesta sessão | Apagar 6 (`users/actions`, `users/manage`, `notify-verification`, `stats`, `audit-logs/stats`, `resolve-migration-conflict`) e **manter `audit-logs`** (é a única leitura da trilha, tem teste); ganhar um visualizador depois |
| D3 | O papel `moderator` deve ver usuários, estatísticas e flags? | Define se `is_admin()` precisa reconhecê-lo (migration) ou se as 4 rotas passam a exigir só `admin` | Só `admin`. Não há moderador cadastrado a ser atendido hoje (conferir `select count(*) from user_roles ur join roles r on r.id=ur.role_id where r.name='moderator'`); se zero, tira `moderator` das 4 rotas e do tipo `AdminRole` |
| D4 | Migrations de admin para tirar `service_role` de vez | Uma onda de segurança própria (ponto de parada do blueprint); não é requisito para o resto | Não agora. Só duas, depois que as linhas fecharem: **M-A1** `admin_set_user_roles(uid, roles[])` security definer, atômica e com auditoria na própria função (resolve o achado 2); **M-A2** versionar as policies de admin de `feature_flags`/`admin_audit_logs`/`appointments` (só reescreve o que já existe em produção). Fora isso, E7 em composition |

Não decididos de propósito (resposta padrão do blueprint): **OpenAPI** do admin fica fora
do spec público (`lib/openapi`), pois é uma API interna e o spec vira superfície de
descoberta; **agentes** (camada 14) negado por padrão.

## Divisão em duas linhas independentes

As linhas não tocam os mesmos arquivos. Cada uma tem os próprios arquivos novos
(`repository`, `composition`, `schemas`, `keys`, `hooks`) e **não edita** os compartilhados:
`lib/query/keys.ts` e `lib/query/effects.ts` (o orquestrador soma as linhas na
integração, como nas ondas anteriores), `lib/auth/require-admin.ts`,
`lib/audit-logger.ts` e `lib/types/supabase.ts`.

| | L1 · usuários + verificações de mentor | L2 · o resto |
|---|---|---|
| Rotas | `users/route`, `users/[id]`, `users/actions`, `users/manage`, `verify`, `verifications/{pending,completed,draft}`, `notify-verification`, `mentors` | `appointments*`, `emails/*`, `invites/*`, `organizations*`, `org-leads`, `retention*`, `overview`, `reports`, `stats`, `feedbacks`, `feature-flags`, `activity-logs`, `ai-usage`, `audit-logs*`, `resolve-migration-conflict` |
| Services | `lib/services/admin/delete-user.service.ts`, `lib/services/verifications/*`, `lib/services/admin/admin.service.ts` (tipos) | `lib/services/admin/{overview,reports,activity-logs}*`, `appointments/admin-appointments.service.ts`, `invites/*`, `organizations/org-leads.service.ts` |
| UI | `EditUserModal`, `UserMetrics`, `MentorApplicationPanel`, `MentorReviewAssistant`, `MentorReviewDraftPanel`, páginas `users` e `verifications` | `AdminAppointmentsManager`, `AdminFeedback*`, `ActivityLogsTable`, `AdminReportsCharts`, `overview/`, `invites/`, `organizations/`, páginas `emails`, `retention`, `feature-flags`, `reports`, `ai-usage`, `logs`, `feedbacks`, `organizations`, `appointments`, `page.tsx` (overview) |
| Arquivos novos | `lib/repositories/admin-users.repository.ts`, `admin-mentor-verification.repository.ts`; `lib/services/admin/users/`; `lib/services/admin/users.composition.ts`; `lib/schemas/admin-users.ts`; `lib/domain/admin/user.entity.ts`; `lib/query/keys/admin-users.ts`; `hooks/admin-users/` | `lib/repositories/admin-ops.repository.ts`; `lib/services/admin/ops.composition.ts`; `lib/schemas/admin.ts`; `lib/query/keys/admin.ts`; `hooks/admin/` |

Pontos de contato (todos só de leitura ou de integração): `logAdminAction` (as duas
importam, nenhuma edita), `requireAdmin` (idem), o `qk` e o `effects` (integração).
O funil de eventos da **Tarefa 4** do `hardening-plan.md` (`/dashboard/admin/funnel`) entra
na L2 como grupo extra, já pelo padrão novo: RPC `security definer` com `is_admin()`
chamada pela **sessão**, sem `service_role`.
`feature-flags` aparece também na onda 3 como domínio: a rota **admin** é da L2; a
parte pública fica para a onda 3 e não pode tocar `app/api/admin/feature-flags`.

## Plano

> Um grupo = um PR pequeno, revisável no celular, que termina com `npm run verify`
> (typecheck + lint + jest) e deixa o app funcionando. Ordem = ordem de merge dentro da
> linha. Testes entram no mesmo PR. **Formato de resposta das rotas não muda** (ponto de
> parada se precisar mudar). Todo uso de `service_role` fica só em `*.composition.ts`, lazy,
> com o service chamando `assertAdmin` antes (D1).

### PR 0 · Base compartilhada (orquestrador, antes de abrir as linhas) · sem migration
- `lib/services/admin/assert-admin.ts`: `assertAdmin(db)` com `rpc("is_admin")` pela
  sessão, `AdminForbiddenError`, e o helper que traduz para 403. Teste: não-admin recusado,
  RPC com erro recusa (nega por padrão).
- `docs/governance/adr/0009-service-role-admin.md`: o inventário acima como exceção E7
  detalhada (rota → razão → destino), no formato do ADR 0007/0008.
- Se D3 = "só admin": tira `moderator` do tipo `AdminRole` e das 4 rotas (um arquivo por
  rota, mecânico; é o único toque em arquivos das duas linhas e por isso fica aqui).

### Linha L1 · usuários + verificações de mentor

| Grupo | O que entra | Migration | App funciona porque |
|---|---|---|---|
| L1-1 Limpeza | Apaga `users/actions`, `users/manage`, `notify-verification` (D2). Resolve o achado 1 | não | nenhuma tinha chamador |
| L1-2 Dados | `lib/domain/admin/user.entity.ts` (`AdminUserView`, `AdminUserUpdate` derivado do schema); `lib/schemas/admin-users.ts`: query da lista (com `limit` máx. 100), `patchBodySchema` movido da rota, `verify` com `userId` UUID. Remove a interface de `admin.service.ts` | não | só tipos e schemas; rotas passam a importá-los |
| L1-3 Leitura de usuários | `admin-users.repository.ts` (sessão) + `users.service.listUsers` com `assertAdmin`; `users/route.ts` fica fino. Testes: repository, service, **rota (hoje sem teste)** | não | mesma resposta |
| L1-4 Escrita de usuário | Repository privilegiado + `users.composition.ts` (lazy, tipado `Database`). `users.service.updateUser`: `assertAdmin`, bloqueia retirar o próprio `admin`, grava `logAdminAction`, mensagem fixa no erro. Papéis e `mentee_profiles` pela **sessão** (policy de admin existe); só `profiles` fica no client privilegiado. Teste de rota de PATCH | não (a atomicidade espera a M-A1, D4) | mesma resposta, mesmo efeito, com auditoria |
| L1-5 Apagar conta | `users/[id]` DELETE e `delete-user.service`: client sai do service para a composition; teste existente continua passando | não | só muda quem cria o client |
| L1-6 Listas de verificação | `admin-mentor-verification.repository.ts` + service para `pending`/`completed`/`mentors`; rotas finas; testes de rota | não | mesma resposta |
| L1-7 Decidir candidatura | `processVerification` recebe repository de papéis (reusa `user-roles.repository`), perfil e mensageria por parâmetro; `verify` com `assertAdmin` e `logAdminAction`; sai o `createServiceRoleClient` do service. Mantém a ordem: papel, perfil, mensagem, e-mail (o teste `notification.service.test.ts` guarda isso) | não | mesma resposta |
| L1-8 Query layer | `lib/query/keys/admin-users.ts`; `hooks/admin-users/` (`useAdminUsers`, `useAdminUpdateUser`, `useAdminDeleteUser`, `useMentorVerifications`, `useDecideVerification`); mapa de efeitos: decidir candidatura invalida lista de usuários e `qk.mentors` (pedido de integração ao orquestrador) | não | hooks ainda sem uso; nada muda na tela |
| L1-9 Tela de usuários | `users/page.tsx` (384) sobre os hooks, em componentes < 150 linhas (filtros, tabela, paginação) | não | **você valida no celular**: listar, filtrar, paginar |
| L1-10 Modal de usuário | `EditUserModal` (589) quebrado em 3 a 4 seções (dados, acadêmico, papéis, candidatura) sobre `useAdminUpdateUser` | não | **você valida**: editar, trocar papel, apagar |
| L1-11 Tela de verificações | `verifications/page.tsx` (502) + `MentorApplicationPanel`, `MentorReviewAssistant` sobre os hooks de L1-8 | não | **você valida**: aprovar, pedir mudanças, rascunho da IA |
| L1-12 pgTAP | `supabase/tests/admin_user_roles_access.test.sql`: admin escreve `user_roles`/`mentee_profiles`/`mentor_profiles`, não-admin não; admin lê `profiles`, e **não** escreve (prova do E7 de `profiles`). Só arquivo de teste | não | roda no CI (Docker) |

Risco da L1: **médio** em L1-4 e L1-7 (troca de papel e aprovação de mentor); ambas
preservam a sequência atual e ganham teste do caminho de erro. Se D4 = sim, a M-A1 entra
depois como L1-13 (com migration, ponto de parada).

### Linha L2 · o resto

| Grupo | O que entra | Migration | App funciona porque |
|---|---|---|---|
| L2-1 Limpeza | Apaga `stats`, `audit-logs/stats`, `resolve-migration-conflict` (D2). Mantém `audit-logs` | não | sem chamadores |
| L2-2 Retenção | `retention` GET pela **sessão** (policies de admin já existem), service com `assertAdmin`; `retention/exempt` com Zod (`userId` UUID), service + composition (E7), `logAdminAction`. Tira `as any` e `error.message` | não | mesma resposta |
| L2-3 Overview | `getAdminOverview` recebe a sessão para `inactive_accounts_queue`; `appointments` continua pelo client privilegiado vindo da composition até a prova pgTAP do L2-10. Rota fica só auth → service. `overview.aggregate.test` segue | não | mesma resposta |
| L2-4 Appointments admin (servidor) | `admin-appointments.service` ganha `assertAdmin`, e-mail e Calendar por parâmetro (adapters que appointments já tem), client vem da composition; as 3 rotas deixam de importar `service_role`. Os 3 `route.test.ts` e o teste do service seguem passando | não | mesma resposta |
| L2-5 Feature flags | `feature-flags` GET/POST/PATCH/DELETE: schema Zod, repository, service com `assertAdmin` e auditoria (a tabela `feature_flag_audit_logs` já é gravada), composition (E7 por ora). Remove o `createClient(... process.env)` da rota. Teste de rota (hoje zero) | não (troca pela sessão espera M-A2) | mesma resposta |
| L2-6 Organizações | `organizations`, `[id]`, `[id]/admins`, `org-leads`: reuso de `organizations.repository.ts`; sai `as any` (tipos existem); service com `assertAdmin`. `org-leads.service` separa `createOrganizationLead` (público, E8) das duas funções de admin (sessão) | não | mesma resposta |
| L2-7 Convites e e-mails | `invites/send`, `audience`, `preview`, `emails/*`: `audience.service` e `invites/send` recebem o client da composition; e-mail por port; `assertAdmin` no service. Testes de rota existem; acrescentar o de "não-admin recusado" | não | mesma resposta |
| L2-8 Feedbacks, relatórios, logs | `feedbacks` (GET/PATCH, hoje com `as any`), `reports`, `activity-logs`, `ai-usage`: repository + service, Zod nas entradas, auditoria no PATCH de feedback | não | mesma resposta |
| L2-9 Query layer | `lib/query/keys/admin.ts`; `hooks/admin/` (`useAdminOverview`, `useAdminAppointments` + mutações de cancelar e reenviar, `useRetention`, `useFeatureFlags`, `useAdminFeedbacks`, `useOrgLeads`, `useActivityLogs`, `useAiUsage`); mapa de efeitos (cancelar sessão invalida lista admin e overview). Pedido de integração do `qk.admin` ao orquestrador | não | hooks ainda sem uso |
| L2-10 Telas pequenas | `retention/page` (352), `feature-flags/page` (349), `emails/page` (385), `ai-usage`, `reports`, `feedbacks`, `AdminFeedbackModeration` (214) | não | **você valida** cada uma no celular; um PR por tela se passar de ~300 linhas de diff |
| L2-11 Appointments admin (tela) | `AdminAppointmentsManager` (653) em 4 a 5 componentes (filtros, tabela, linha, modais de cancelar e reenviar) sobre os hooks; o teste de 308 linhas migra junto | não | **você valida**: filtrar, cancelar, reenviar |
| L2-12 pgTAP de leitura admin | `supabase/tests/admin_read_access.test.sql`: admin lê `appointments`, filas de retenção, `import_records`; não-admin não. O resultado decide se `overview` e `GET appointments` saem do `service_role` (um PR curto depois) | não | só arquivo de teste |
| L2-13 Funil (Tarefa 4, opcional) | RPC `admin_funnel_by_week()` security definer com `is_admin()`, sem dado pessoal; `/dashboard/admin/funnel`; pela sessão | **sim**, uma só (ponto de parada, não rodar `db push`) | página nova, não afeta as outras |

Risco da L2: **médio** em L2-4 (cancelar e reenviar mexem em e-mail e Calendar; o service
já tem teste e ele guarda a ordem) e em L2-5 (flags afetam o app inteiro; testar GET e
PATCH antes de mexer). O resto é baixo.

## Pontos de parada que este plano vai tocar

1. D1 a D4 antes do PR 0 (D2 antes de L1-1 e L2-1; D3 antes do PR 0).
2. Apagar rotas (L1-1, L2-1): ponto de parada do blueprint, depende de D2.
3. L1-9 a L1-11, L2-10 e L2-11 mudam a UI: você valida antes de eu seguir.
4. M-A1, M-A2 e L2-13 são as únicas migrations; nenhuma entra sem você pedir.
5. Nenhum grupo muda o formato de resposta das rotas.

## Handoff

> Seção para o orquestrador e as linhas preencherem a cada merge (o que entrou, o que
> ficou, o que o próximo grupo precisa saber).
