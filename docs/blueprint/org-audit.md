# Audit do domínio org (organizações / multi-tenant, 14 camadas)

> Modo `audit` + `plan`: só leitura, nenhum código mudou. Data: 2026-10-19.
> Legenda: **ok** = cumpre a regra da camada; **parcial** = existe mas foge da
> regra; **falta** = não existe. A coluna "Prova" é o arquivo que sustenta o estado.

Escopo lido: `app/api/org/**` (3 rotas), `app/api/me/organizations/route.ts` (a
rota do lado da pessoa, mesma tabela), `app/api/contact/organization/route.ts`,
`lib/services/organizations/**` (3 services, 3 testes), `lib/auth/require-org-admin.ts`,
`lib/schemas/organizations.ts` e `organization-lead.ts`,
`app/[locale]/dashboard/org/page.tsx` (612 linhas), `app/[locale]/o/[slug]/page.tsx`,
`components/organizations/`, `components/profile/OrganizationsTab.tsx`,
`components/admin/organizations/`, 10 migrations que citam
`organizations`/`organization_members` e `docs/domains/organizations.md`.
As rotas `app/api/admin/**` foram lidas só para listar o que tocariam (seção
"Rotas admin").

## Camada × estado

| # | Camada | Estado | Prova |
|---|---|---|---|
| 1 | Migration SQL | **ok** | Tabelas e RLS em `20260921000000_organizations_v2.sql`; recursão corrigida com `is_org_admin()` (security definer) em `…000001`; status (`invited/requested/active`) e `is_org_admin` só para admin **ativo** em `…000002`; `join_policy` em `…000004`; leads em `20260928000003_organization_leads.sql`; leitura pública só de mentores listados em `20261015000000_…public_read_mentors_only.sql`; `is_admin_of_orgs_member` (admin vê perfis dos membros) em `20260929150000_profiles_emergency_exposure_fix.sql`; `org_members_quiz_done` em `20260923000005_quiz_responses_privacy.sql`. Policies redefinidas em várias migrations: o estado final só se confirma lendo a última de cada uma. |
| 2 | Tipos gerados | **ok, com resíduo** | `organizations`, `organization_members` (com `status`), `organization_leads`, `is_org_admin` e `org_members_quiz_done` já estão em `lib/types/supabase.ts` (linhas 1717, 1762, 1815, 2717, 2730). Mas o código ainda faz `from("organizations" as any)` como se o tipo não existisse: 20 `as any` nos arquivos da linha (`app/api/org/**` 8, `me/organizations` 4, `org-dashboard.service.ts` 5, `org-public.service.ts` 2, `require-org-admin.ts` 1) mais 12 nas rotas admin. São resquício de quando as tabelas ainda não estavam nos tipos. |
| 3 | Entity | **falta** | Não existe `lib/domain/organizations/`. `OrgDashboardMember`, `OrgDashboardSummary` etc. são interfaces escritas à mão em `org-dashboard.service.ts:3-41`, e a página **redeclara** `Member`, `Summary` e `OrgOption` (`dashboard/org/page.tsx:23-56`). `OrgDashboard.organization` é `Record<string, unknown>`. A regra "quem é mentor/beneficiário" (derivar de `user_roles`) está duplicada em `getOrgDashboard` (L130-137) e `getPlatformRole` (L204-218). |
| 4 | Zod | **parcial** | `lib/schemas/organizations.ts` cobre só as 3 entradas das rotas admin. Schemas inline nas rotas: `inviteSchema`, `approveSchema` (`members/route.ts:12-13`), `updateOrgSchema` (`[id]/route.ts:35`), `joinSchema` (`me/organizations/route.ts:37`). Sem validação: `id` da URL (não é UUID-checado), `period` (if-else à mão em `[id]/route.ts:20`), `userId` do `DELETE ?userId=`, `organizationId` do `DELETE` de `me/organizations`. Sem schema de saída em nenhuma rota. |
| 5 | Repository | **falta** | `supabase.from("organization_members")`/`from("organizations")` direto em 5 arquivos: as 3 rotas `app/api/org/**`, `me/organizations/route.ts`, `require-org-admin.ts:50`, `org-dashboard.service.ts:55-115`, `org-public.service.ts:13,43`. Também `from("appointments")`, `from("user_roles")`, `from("appointment_feedbacks")`, `from("profiles")` dentro do service de dashboard e das rotas. RPCs `is_org_admin` e `org_members_quiz_done` chamadas direto (a primeira nem é chamada: ver achado 3). |
| 6 | Ports | **falta** | E-mail é função direta de `lib/email/brevo.ts` (`sendOrgInvite`, `sendOrgMembershipApproved`, `sendOrgJoinRequestToAdmin`, `sendAdminNewOrganizationLead`) importada na rota, sempre com `.catch(() => null)`. Não há interface nem fake. O acesso privilegiado (achado 1) também não passa por port. |
| 7 | Service | **parcial** | Existe `lib/services/organizations/` com 3 arquivos e testes. `getOrgDashboard(supabase, id, period)` é a única leitura bem separada (e o JSDoc diz o porquê). Mas **todas as escritas** (convidar, aprovar, recusar, remover, trocar `join_policy`, pedir para entrar, aceitar convite, sair) vivem nas rotas: a máquina de estados `none → invited/requested → active` está espalhada entre `org/[id]/members/route.ts` e `me/organizations/route.ts`. `org-public.service` e `org-leads.service` criam o próprio client (`createClient()`/`createServiceRoleClient()`) dentro, em vez de recebê-lo. |
| 8 | Route handler | **parcial** | 3 rotas em `app/api/org` + `me/organizations` fazem auth (`requireOrgAdmin`) → Zod (parcial) → banco direto → status. Fogem do "fino": `members/route.ts` (158 linhas) tem regra de convite em 4 ramos, lookup de e-mail e envio de e-mail; `me/organizations/route.ts` (148) tem regra de `join_policy` e notifica admins. Erro → status via `errorResponse`/`handleApiError` (consistente: `{ data, message }` / `{ error, code }`). `contact/organization/route.ts` usa `NextResponse.json` cru e `catch (error: any)`. |
| 9 | OpenAPI | **falta** | `lib/openapi/paths/` só tem `legal`, `mentors`, `quiz`. Nenhuma rota de org documentada. A dependência `@asteasolutions/zod-to-openapi` já está no `package.json`. |
| 10 | Query layer | **falta** | Sem `qk.org` em `lib/query/keys.ts`, sem efeitos, sem `hooks/organizations/`. A mesma consulta `GET /api/me/organizations` é feita à mão em dois lugares sem cache compartilhado: `JoinOrganizationButton.tsx:30` e `OrganizationsTab.tsx:28`. Aceitar o convite em `/profile` não invalida nada na página `/o/[slug]` aberta. A página do dashboard faz 6 `fetch` + `useState` + recarrega tudo a cada ação (`loadOrg`). |
| 11 | Página e componentes | **parcial** | `/o/[slug]` é Server Component e chama o service (certo). `/dashboard/org` é **um** client component de 612 linhas com 11 `useState`, 6 handlers de rede, a geração do CSV (L140-194) e todo o JSX. Também acima de ~150: `ActiveOrganizationsTab.tsx` 370 (admin, 8 `useState`, `fetch` direto), `OrganizationsTab.tsx` 190. `catch (error: any)` em toda parte. |
| 12 | Testes | **parcial** | Há: `org-dashboard.service.test.ts` (3 casos), `org-public.service.test.ts` (3), `org-leads.service.test.ts` (3), `contact/organization/route.test.ts`, `admin/org-leads/route.test.ts`. **Sem teste**: as 3 rotas `app/api/org/**`, `me/organizations`, `require-org-admin.ts`, a máquina de estados de membership, a derivação de papel, o CSV. **Sem pgTAP** para as policies de `organizations`/`organization_members`, apesar de 6 migrations de RLS e de uma invariante no STATUS (`is_org_admin()`). `supabase/tests/` não tem nenhum arquivo de org. E2E: `e2e/smoke.spec.ts` não cobre org. |
| 13 | Tooling e CI | **n/a** | É do repositório, não do domínio. |
| 14 | Superfície para agentes | **falta (decidir)** | Nenhuma capability de org em `lib/agents/capabilities/` (só appointments, feedback, mentors, platform). `lib/services/assistant/tools.ts:194` só tem texto estático ("topic organizations") de base de conhecimento. O JSDoc de `getOrgDashboard` já diz que foi separado para ser reaproveitado por tools. Ver D3. |

## Achados que não são "falta de camada"

1. **`service_role` em 3 pontos, nenhum com ADR, 2 deles em rota.** O ADR 0005
   cobre só convites e o 0007 só o quiz. Razão provável de cada um:
   - `app/api/org/[id]/members/route.ts:36` (a "1 rota com service_role" do
     escopo): achar a conta pelo e-mail (`profiles.eq(email)`) de alguém que
     **ainda não é membro**. A policy de `profiles` só deixa o admin de org ver
     perfis de quem já é membro (`is_admin_of_orgs_member`), então a busca de um
     estranho não passa por RLS. Razão legítima, mas é o convite funcionando
     como oráculo de "este e-mail tem conta na Menvo?" para qualquer admin de
     org (404 com mensagem própria vs. 200). Aceitável no piloto; vale o ADR
     registrar.
   - `app/api/me/organizations/route.ts:98` (POST, pedir para entrar): achar os
     e-mails dos admins da org para avisá-los. Quem pede ainda não é membro e
     só enxerga a própria linha (`organization_members_self_read`), e o e-mail
     de estranhos em `profiles` é restrito. Razão legítima. Também é uma rota
     fazendo trabalho de service, contra a regra "dentro de um service, nunca
     numa rota".
   - `lib/services/organizations/org-leads.service.ts:16`: inserir em
     `organization_leads`, que não tem policy de insert público (decisão de
     `docs/domains/organizations.md` §7: formulário público sem login). Está
     dentro de um service (regra cumprida), documentado no domain doc, falta o
     ADR. A leitura e o PATCH do admin usam o client do usuário (certo).
2. **Duas famílias de formato de resposta.** `/api/org/**` e `me/organizations`
   usam o envelope `{ data, message }` / `{ error, code }`. `contact/organization`
   e `admin/org-leads` usam `{ ok }`, `{ leads }`, `{ lead }` e `{ error }` sem
   `code`. O app já consome as duas; o plano **não** unifica (mudar o formato é
   ponto de parada).
3. **`requireOrgAdmin` não usa `is_org_admin()`.** A invariante do STATUS diz
   que checagem de admin de org passa por `is_org_admin()`; o guard faz duas
   consultas (`user_roles` e depois `organization_members`) e compara
   `role`/`status` em TypeScript com `as any` (`require-org-admin.ts:38-57`).
   O resultado é equivalente (lê a própria linha, permitida por `self_read`),
   mas são 2 viagens ao banco em toda chamada e a regra fica duplicada fora do
   SQL. O guard também mistura camada: devolve `NextResponse` (HTTP) numa lib
   de auth.
4. **Admin de plataforma passa no guard, mas não nos RPCs.** `requireOrgAdmin`
   deixa um admin de plataforma ler qualquer org, porém `org_members_quiz_done`
   e `is_admin_of_orgs_member` testam `is_org_admin()`, que só vale para
   admin **ativo da própria org**. Para um admin de plataforma que não é membro,
   `quizDone` volta `false` para todos e os perfis dos membros dependem de outra
   policy. Hoje não aparece na UI: `/api/org/mine` só lista orgs em que a pessoa
   é admin-membro, então o admin de plataforma não chega ao dashboard. Só
   quebra se alguém chamar `GET /api/org/[id]` direto. Corrigir exige migration
   (ver D2).
5. **`getOrgDashboard` não escala com o tamanho da org.** Busca **todas** as
   linhas de `appointments` dos membros (`.in("mentee_id", ids)`, sem
   `limit`) só para contar no TypeScript, e depois monta
   `appointment_feedbacks.in("appointment_id", completedIds)` com todos os ids
   concluídos na URL do PostgREST. Com algumas centenas de sessões concluídas
   a URL passa do limite (~8 KB, 36 caracteres por UUID) e a nota média falha
   em silêncio (o erro é ignorado: `const { data: feedbacks }`). Não é N+1
   (são 6 consultas em paralelo), mas é o primeiro ponto que quebra num piloto
   grande. Dá para mitigar sem migration (embutir `appointment_feedbacks(rating)`
   no select de `appointments`, a FK existe) e a solução definitiva é uma RPC de
   agregação (migration, D2).
6. **Contagem que mistura estados.** `sessionsBooked`/`sessionsGiven` contam
   sessões em qualquer status (inclui canceladas) e `totalDiagnosticsDone` ignora
   o filtro de período. Provavelmente não é intencional, mas muda número que a
   organização já vê e exporta em CSV. **Não muda no plano**; fica registrado
   para o Paul decidir quando quiser (é mudança de comportamento, não de camada).
7. **`DELETE /api/org/[id]/members` aceita remover outro admin, inclusive o
   último.** A UI esconde o botão para `role === "admin"`, a API não bloqueia
   (só bloqueia remover a si mesmo). Um admin pode deixar a org sem nenhum
   admin ativo; a única forma de recuperar é um admin de plataforma atribuir
   outro em `/api/admin/organizations/[id]/admins`. Ver D4.
8. **Validação frouxa de parâmetros.** `userId` do DELETE não é conferido como
   UUID (vai direto ao PostgREST); `id` não-UUID em `GET /api/org/[id]` dá 403
   para quem não é admin e 500 para admin de plataforma (a consulta estoura
   `22P02`). `email` do convite é só `trim()`, sem `toLowerCase()`, e a busca
   é `eq("email", …)` (se o e-mail estiver salvo em minúsculas, "Ana@x.com" não
   acha a conta).
9. **`catch (error: any)` e `as any` no cliente.** 6 handlers na página, 3 em
   `OrganizationsTab`, 2 em `JoinOrganizationButton`; a resposta `json` não
   passa por nenhum schema (`json.data.members` pode ser `undefined` sem aviso).
10. **Estado do módulo `lib/utils/supabase/service-role.ts`**: o JSDoc ainda
    lista "Bulk invitations", "expiring memberships, activity logs" como usos,
    resquício da v1 removida. Não é código morto (o client é usado), mas o texto
    convida a novos usos. Fica fora da linha (arquivo compartilhado de
    `lib/utils/`); entra em "Pedidos para arquivos compartilhados".

## Rotas admin (só leitura; pertencem a outra linha)

Se a linha admin quiser aplicar o mesmo tratamento, tocaria:

| Arquivo | O que tem | Efeito do plano da org |
|---|---|---|
| `app/api/admin/organizations/route.ts` | `from("organizations" as any)` direto, `insert … as any`, conta membros no TS | Passaria a chamar `organizationsService` (PR 4). Hoje funciona sem mudar. |
| `app/api/admin/organizations/[id]/route.ts` | `update({status} as any)` direto | Idem. |
| `app/api/admin/organizations/[id]/admins/route.ts` | busca perfil por e-mail com o client do usuário (admin de plataforma enxerga tudo), `insert role:'admin' as any` | Idem; reutiliza o port de busca por e-mail do achado 1. |
| `app/api/admin/org-leads/route.ts` | já chama `org-leads.service` (bom), formato próprio `{leads}`/`{lead}` | Nenhuma mudança obrigatória. |
| `app/api/admin/overview/route.ts` | agrega contagem de orgs | Fora de escopo. |

O plano abaixo **não edita nenhum desses arquivos**. Ele deixa
`organizationsService` pronto e as rotas admin migram depois, por decisão da
linha admin. Os schemas existentes de `lib/schemas/organizations.ts`
(`createOrganizationSchema` etc.) só ganham exports novos, sem alterar os
atuais.

## Resumo

| Estado | Camadas |
|---|---|
| ok | 1, 2 (com resíduo de `as any`) |
| parcial | 4, 7, 8, 11, 12 |
| falta | 3, 5, 6, 9, 10, 14 (decidir) |
| n/a | 13 |

O dado está bem protegido (RLS com `is_org_admin`, RPC para o quiz, leitura
pública limitada a mentores listados). O que falta é a estrutura de código
acima dele: a máquina de estados de membership está nas rotas, a página tem
612 linhas e o `service_role` está sem ADR e (em 2 de 3 casos) dentro de rota.
Próximo modo sugerido: responder D1-D4 e `modo apply org 3-4` (PR 1).

---

# Plano

> Modo `plan`: só documento. **Cada PR abaixo é um commit/PR separado**, pequeno
> o bastante para revisar no celular (meta: menos de ~300 linhas de diff, a
> maioria movida). Cada um termina com `npm run verify` (typecheck + lint +
> jest) e deixa o app funcionando: **o formato de resposta das rotas não muda**
> (`{ data, message }` / `{ error, code }` continuam idênticos). Teste da
> camada entra no mesmo PR, nunca no fim. Nenhum PR precisa de migration;
> o que precisaria vai para D2.

Ordem pensada para cada PR poder ser mergeado sozinho: primeiro o que não
muda comportamento (tipos, repository), depois o que troca a origem dos dados
(service, rotas), depois o cliente (hooks, página).

## Decisões suas antes de começar

| # | Decisão | Por que trava | Minha sugestão |
|---|---|---|---|
| D1 | `service_role` em 3 pontos (busca de conta por e-mail no convite; e-mails dos admins ao pedir para entrar; insert de lead): escrever o ADR 0008 aceitando como exceção, ou trocar por RPC `security definer` | Regra do projeto: exceção só com ADR e só dentro de um service/port, nunca em rota. Hoje 2 de 3 estão em rota | **ADR 0008 curto** e mover os 3 para um port `OrgDirectory`/service (PR 4 e 5), sem migration. Para o convite, uma RPC `find_profile_for_org_invite(p_org, p_email)` gated por `is_org_admin` tiraria o `service_role`, mas é migration e não elimina o oráculo de e-mail. Para os e-mails dos admins, RPC devolveria o e-mail dos admins ao solicitante, pior que o `service_role` server-side. Registrar o risco do oráculo de e-mail como aceito |
| D2 | Migration futura (não nesta linha): (a) `is_org_admin`-gated RPCs aceitarem também admin de plataforma, ou tirar o admin de plataforma do guard; (b) RPC `org_impact_summary(p_org, p_since)` que agrega sessões/horas/nota no banco | Qualquer das duas é migration, que a linha não pode criar. (a) é achado 4; (b) é achado 5 | Não fazer agora. (a): documentar que `/api/org/[id]` é para admin-membro e remover o ramo de admin de plataforma do guard **só se** o Paul confirmar que não o usa (hoje a UI não o alcança). (b): mitigar sem migration no PR 3 (embutir `appointment_feedbacks(rating)`, limitar janela) e só criar a RPC quando alguma org passar de ~200 sessões concluídas. Quando decidir, uma linha com timestamp reservado cuida das duas juntas, com pgTAP |
| D3 | Org entra em `lib/agents` (leitura do resumo do dashboard para o admin da org)? | Camada 14; exige liberar em `exposure.ts` (ponto de parada) e traz e-mail e nome de membros para o assistente | **Não agora.** São dados pessoais de terceiros (LGPD) e não há demanda. Depois do PR 4 o `organizationsService.getDashboard` já existe e a capability seria um arquivo pequeno (`organizations.dashboard.read`, papel org-admin, nunca no MCP público) |
| D4 | Impedir que `DELETE …/members` remova o **último admin ativo** da org (hoje a API deixa; só a UI esconde o botão) | Muda comportamento de uma rota (não o formato): passa a devolver 400 em vez de 200 nesse caso | **Sim**, bloquear só o último admin (400 `BAD_REQUEST`, mesma família de erro de "sair da org"). Remover outro admin quando há mais de um continua permitido. Entra no PR 4 com teste |

(O `@asteasolutions/zod-to-openapi` já está instalado, então a dependência do
OpenAPI não precisa de decisão aqui.)

## PRs, em ordem

### PR 1 · Entity e Zod (camadas 3-4) · sem migration, sem mudança de comportamento
- `lib/domain/organizations/organization.entity.ts`: `Organization` (Pick da Row: id, slug, name, type, status, join_policy, created_at), `OrgMember`, `OrgDashboardMember`, `OrgDashboardSummary`, `OrgPeriod`, `MembershipStatus`, `PlatformRole` derivados de `Tables<"organizations">`/`Tables<"organization_members">`. Funções puras com teste: `derivePlatformRole(roleNames)` (mentor ganha de mentee; remove a duplicação entre `getOrgDashboard` e `getPlatformRole`), `periodStart(period, now)`, `summarizeMembers(members)`, `isActiveAdmin(m)`.
- `lib/schemas/organizations.ts` (**só adiciona exports**): `orgIdParamSchema` (UUID), `orgPeriodSchema` (`z.enum(["all","30d","90d","1y"]).catch("all")`, mantém o fallback atual para valor desconhecido), `inviteMemberSchema` (e-mail com `toLowerCase`), `memberUserIdSchema`, `updateOrgSettingsSchema`, `joinOrganizationSchema`, e os schemas de saída: `orgDashboardSchema`, `myOrgOptionSchema`, `myMembershipSchema`.
- Os 20 `as any` de tipo desatualizado **não saem neste PR**: cada um sai junto com a camada que reescreve o arquivo (PRs 2 a 5), para não misturar limpeza com mudança. DTOs viram `z.infer`; a interface `Member`/`Summary` da página fica até o PR 8.
- Testes: derivação de papel (mentor + mentee → mentor), `periodStart`, schemas (UUID inválido, período desconhecido cai em `all`, e-mail em maiúsculas vira minúscula).
- Risco: baixo. Só adiciona arquivos e exports.

### PR 2 · Repository de leitura + `org-public.service` (camada 5)
- `lib/repositories/organizations.repository.ts`: interface `OrganizationsRepository` + `createOrganizationsRepository(db)` (recebe o client, com RLS). Métodos de leitura: `findBySlug`, `findById`, `listAdminOrganizations(userId)` (a consulta do `/api/org/mine`), `listMembershipsOf(userId)` (a de `me/organizations`), `listMembers(orgId)` (já com `profiles(id, full_name, email)` embutido: uma consulta), `findMembership(orgId, userId)`, `listOpenOrganizationsForMentors(ids)` (a de `getOpenOrganizationsForMentors`), `isOrgAdmin(orgId)` via RPC `is_org_admin`, `quizDoneEmails(orgId)` via RPC `org_members_quiz_done`. Erros viram `RepositoryError` (`lib/repositories/repository-error.ts`). Sem `as any`: os tipos gerados já cobrem.
- `org-public.service.ts` passa a usar o repository mantendo **assinaturas e retornos idênticos** (`getOrganizationBySlug`, `getOpenOrganizationsForMentors` são importados por `app/[locale]/mentors/[slug]/page.tsx`, `app/actions/mentors.ts` e `lib/services/mentors/home-highlights.ts`, que são da linha mentors e não podem quebrar).
- Testes: repository com client fake (colado no padrão de `quiz.repository.test.ts`); `org-public.service.test.ts` existente segue passando sem mudança.
- Risco: baixo. Nenhuma rota muda ainda.

### PR 3 · `getOrgDashboard` sobre o repository (camada 7, leitura)
- `org-dashboard.service.ts` passa a receber o repository em vez do client cru, usa `derivePlatformRole`/`periodStart`/`summarizeMembers` do PR 1. `getPlatformRole` fica como wrapper sobre a mesma função pura.
- Mitigação do achado 5 **sem migration e sem mudar números**: o select de `appointments` embute `appointment_feedbacks(rating)` (a FK `appointment_feedbacks_appointment_id_fkey` existe), eliminando a consulta com a lista de ids na URL; o filtro de `completed` e a média continuam no TypeScript. O resultado tem de ser idêntico: o teste compara a saída com a de uma fixture do comportamento atual.
- `GET /api/org/[id]` e `GET /api/org/mine` passam a chamar o service/repository (tira os `as any` dessas duas rotas). `id` não-UUID passa a dar **400** (antes 403/500): é mudança de status só em entrada inválida, formato do erro igual.
- Testes: os 3 existentes + período, org sem membros, org inexistente (`null` → 404), e a rota `GET /api/org/[id]` (hoje sem teste): 401/403/404/200.
- Risco: **médio**. É o número que a organização mostra e exporta. A fixture de regressão cobre esse risco; o PR não corrige o achado 6.

### PR 4 · Ports + service de administração da org (camadas 6-8), depende de D1 e D4
- Ports: `lib/ports/org-mailer.ts` (`sendInvite`, `sendApproved`, `sendJoinRequest`, falha de e-mail nunca derruba a operação, como hoje) com adapter `lib/ports/adapters/org-mailer.brevo.ts`; `lib/ports/org-directory.ts` (`findAccountByEmail`, `listAdminEmails`) com adapter `lib/ports/adapters/org-directory.supabase.ts`, **o único arquivo da linha que importa `createServiceRoleClient`** (ADR 0008).
- `lib/services/organizations/organizations.service.ts`: `invite`, `approve`, `remove`, `updateJoinPolicy`, `getDashboard`, `listMine`, retornando uniões de resultado (`{ kind: "invited" | "reinvited" | "approved" | "already_active" | "no_account" }`), no estilo de `AccountOutcome` do quiz, sem lançar `NextResponse`. Aqui entra D4 (`last_admin`). `organizations.composition.ts` cria o client privilegiado de forma preguiçosa (como `quiz.composition.ts`), para o build rodar sem segredo.
- `requireOrgAdmin` passa a usar `repo.isOrgAdmin` (uma RPC `is_org_admin`) mais a checagem de admin de plataforma, mantendo a assinatura e os mesmos 401/403 (resolve o achado 3 para a parte de `from("organization_members")`).
- Rotas `app/api/org/[id]/members` (POST/PATCH/DELETE) e `app/api/org/[id]` (PATCH) ficam em: guard → Zod → service → status. Mensagens e códigos idênticos aos atuais.
- Testes: service com repository, mailer e directory falsos para os 4 ramos do convite (conta inexistente, já ativo, já convidado, pedido pendente vira ativo), aprovação sem pedido (404), não remover a si mesmo, D4, e-mail que falha não derruba; testes das rotas.
- Risco: **médio**. É onde mora a máquina de estados. Os ramos do convite hoje não têm teste algum; escrevê-los primeiro contra o comportamento atual (antes de mover) é o jeito de provar que não mudou.

### PR 5 · Lado da pessoa: `me/organizations` (camadas 7-8)
- Métodos `requestToJoin`, `acceptInvite`, `leave`, `listMemberships` no mesmo service. `join_policy = invite_only` sem convite continua 403 com a mesma mensagem. A notificação aos admins usa `OrgDirectory.listAdminEmails` e `OrgMailer.sendJoinRequest` (sai o `service_role` da rota).
- `DELETE ?organizationId=` ganha validação UUID (400 em vez de passar lixo ao banco).
- Testes: pedido em org aberta, em org `invite_only` (403), convite vira ativo, idempotência (já ativo / já solicitado), sair.
- Risco: baixo-médio. Poucos ramos, rota curta depois.

### PR 6 · Contrato (camada 9)
- `lib/openapi/paths/organizations.ts` gerado dos schemas do PR 1 para as 3 rotas de `/api/org` e as 3 de `/api/me/organizations`, mais o teste de drift (`npx jest lib/openapi`).
- Pedido para arquivo compartilhado: o import em `lib/openapi/document.ts`.
- Risco: baixo.

### PR 7 · Query layer + hooks (camada 10), mexe em 2 componentes
- Pedido para arquivos compartilhados (o agente não edita): em `lib/query/keys.ts`, `qk.org = { all: ["org"], mine: ["org","mine"], dashboard: (orgId, period) => ["org","dashboard",orgId,period], memberships: (userId) => ["org","memberships",userId] }`; em `lib/query/effects.ts`, `"org.member.invite" / "org.member.approve" / "org.member.remove" / "org.settings.update"` → `[qk.org.dashboard…]` (por prefixo `["org","dashboard",orgId]`), e `"org.membership.join" / "…accept" / "…leave"` → `[qk.org.memberships(userId)]`.
- `hooks/organizations/`: `useMyAdminOrganizations`, `useOrgDashboard(orgId, period)`, `useMyMemberships`, `useInviteMember`, `useApproveMember`, `useRemoveMember`, `useUpdateJoinPolicy`, `useJoinOrganization`, `useLeaveOrganization`. Cada resposta passa pelo schema de saída pelo cliente tipado `lib/query/http.ts`.
- `JoinOrganizationButton` (121 linhas) e `OrganizationsTab` (190) trocam os `fetch` soltos por `useMyMemberships` (um cache só: aceitar o convite no perfil passa a atualizar o botão da página da org). `OrganizationsTab` é dividida em `MembershipCard` + lista para ficar <150.
- Testes: hooks (padrão de `hooks/quiz/quiz-hooks.test.tsx`), componentes.
- Risco: **médio** (é UI). O Paul valida: pedir para entrar, aceitar convite, sair, convidar, aprovar.

### PR 8a · Página do dashboard, parte 1: extrações puras (camada 11)
- `lib/domain/organizations/org-report.csv.ts`: `buildOrgImpactCsv(org, members, summary, period)` extraída de `exportCsv` (L140-194), com teste (escape de aspas, BOM, rótulos de papel/status). O download (Blob + `<a>`) fica num helper pequeno `downloadCsv(filename, content)` ao lado.
- `components/organizations/dashboard/MembersTable.tsx` (<150): une `MemberRow` e as duas `<Table>` repetidas (variantes `booked`/`given`), recebendo a Entity por props.
- `page.tsx` cai de 612 para ~430 linhas e continua igual na tela.
- Risco: baixo (mover código). Teste: CSV e `MembersTable` (estado vazio, convidado com opacidade, admin sem botão remover).

### PR 8b · Página do dashboard, parte 2: cartões de leitura
- `ImpactToolbar.tsx` (filtro de período + botão CSV), `ImpactCards.tsx` (os 4 cartões de impacto, um `StatCard` em vez de 4 blocos copiados), `SummaryCards.tsx` (3 cartões). Todos <100 linhas, sem estado próprio.
- `page.tsx` cai para ~250 linhas.
- Risco: baixo. Só apresentação.

### PR 8c · Página do dashboard, parte 3: ações e estado (depende do PR 7)
- `InviteMemberCard.tsx`, `PendingRequestsCard.tsx`, `JoinPolicyCard.tsx` (cada um usa o seu hook de mutation: some `busyUserId`/`inviting`/`updatingPolicy` do pai, vira `isPending`).
- `OrgDashboard.tsx` (client, orquestra os hooks e o período, <150 linhas) e `page.tsx` com ~15 linhas (envolve em `PageContainer`, estados de carregando e "não administra nenhuma org"). `useOrgDashboard` substitui os 6 `fetch` e o `loadOrg` manual: as ações invalidam via mapa de efeitos, em vez de recarregar tudo a mão.
- Remove `catch (error: any)`: erros viram `ApiClientError` e o `toast` mostra `error.message`.
- Risco: **médio** (UI). Passo a passo manual para o Paul: abrir `/dashboard/org`, trocar período, exportar CSV, convidar, aprovar, recusar, remover, alternar a política.

### PR 9 · Testes de RLS (pgTAP) · sem migration
- `supabase/tests/organizations_access.test.sql` (precisa de Docker, `supabase test db`): admin de org A não lê/escreve membros da org B; membro comum só vê a própria linha; `self_request` exige `join_policy = 'open'`; `self_accept_invite` não permite virar admin; anon só vê mentores listados de orgs abertas; `org_members_quiz_done` vazio para quem não é admin da org; `is_org_admin` falso para linha `invited`/`requested`. Dá prova automática da invariante do STATUS e do achado 4.
- Risco: baixo. Pode rodar em paralelo a qualquer PR depois do 1. Se algum teste revelar buraco de RLS, vira decisão do Paul (migration), não conserto nesta linha.

### PR 10 · Leads (opcional, camadas 4-8 de `org-leads`)
- `lib/repositories/organization-leads.repository.ts` (inserção com client privilegiado injetado, listagem e update com o client do usuário), `org-leads.service` recebe o repository e sai do `createClient()` interno. `contact/organization/route.ts` ganha `AppError`/status sem o `catch (error: any)` e o honeypot/rate limit continuam na rota, nesta ordem. Formato `{ ok }`, `{ leads }`, `{ lead }` **não muda**.
- Cobre a parte de lead do ADR 0008. Menor valor que os anteriores; fica por último e só se o Paul quiser.

### Admin (fora desta linha, lista para o Paul)
- `components/admin/organizations/ActiveOrganizationsTab.tsx` (370 linhas, 8 `useState`, `fetch` direto) e `OrgLeadsTab.tsx` (171) estão acima de 150 e sem hooks. São componentes de organização e podem ser divididos no mesmo estilo do PR 8, mas dependem de as rotas admin migrarem para o service (linha admin). Proposta: tratar depois do PR 8c, num PR próprio, **se** a linha admin liberar.

## Pedidos para arquivos compartilhados (o agente de linha não edita)

| Arquivo | Linha exata |
|---|---|
| `lib/query/keys.ts` | `org: { all: ["org"] as const, mine: ["org", "mine"] as const, dashboard: (orgId: string, period: string) => ["org", "dashboard", orgId, period] as const, memberships: (userId: string) => ["org", "memberships", userId] as const }` |
| `lib/query/effects.ts` | `"org.member.change": (ctx: { orgId: string }): Keys => [["org", "dashboard", ctx.orgId]]` (convidar, aprovar, remover, política) e `"org.membership.change": (): Keys => [["org", "memberships"], ["org", "mine"]]` (pedir, aceitar, sair) |
| `lib/openapi/document.ts` | import de `lib/openapi/paths/organizations.ts` |
| `lib/agents/exposure.ts` | nada, enquanto D3 = não |
| `docs/STATUS.md` | entrada do journal: org no blueprint, ADR 0008, PRs 1-9 mergeados |
| `docs/governance/adr/0008-org-service-role.md` | (escrito pelo orquestrador, D1) as 3 exceções, quem chama, risco aceito do oráculo de e-mail |
| `lib/utils/supabase/service-role.ts` | trocar o JSDoc ("Use cases: bulk invitations, expiring memberships, activity logs") por referência aos ADRs 0005, 0007 e 0008 |
| `docs/domains/organizations.md` | só `last_reviewed`/`source_of_truth` (apontar para `organizations.service.ts`); o conteúdo não muda |

## Pontos de parada que este plano vai tocar
1. D1: ADR 0008 (antes do PR 4).
2. D4: bloqueio do último admin (antes do PR 4).
3. PR 3 mexe em números que a organização vê; o Paul confere a fixture.
4. PRs 7 e 8c mudam a UI: o Paul valida antes de eu seguir.
5. D2 (migration) só é aberta depois do PR 9, se o pgTAP ou o crescimento de uso pedir.

Nenhum PR precisa de migration nova.
