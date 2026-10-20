# Audit do domínio profile (14 camadas)

> Modo `audit` + `plan`: só leitura, nenhum código mudou. Data: 2026-10-19.
> Legenda: **ok** = cumpre a regra da camada; **parcial** = existe mas foge da
> regra; **falta** = não existe. A coluna "Prova" é o arquivo que sustenta o estado.

Escopo lido: `app/api/profile/**` (7 rotas, 3 com teste), `app/api/me/**` (3 rotas,
nenhum teste), `lib/schemas/profile.ts`, `lib/services/mentees/*`,
`lib/services/auth/own-profile-columns.ts`, `lib/services/mentors/mentor-profile-fields.ts`
(só leitura, é do domínio mentors), `hooks/useProfile.ts`, `hooks/useFavorites.ts`,
`hooks/useNotifications.ts`, `hooks/useOnboarding.ts`, `lib/auth/auth-context.tsx`,
`components/profile/**`, `components/organizations/JoinOrganizationButton.tsx`,
as migrations de `profiles`, `mentor_profiles`, `mentee_profiles`, `user_roles` e
`organization_members`, e `docs/domains/profiles-schema.md`.

Nesta sessão o MCP do Supabase respondeu "Unauthorized", então **as policies
reais do banco não foram conferidas**. Tudo que depende delas está marcado como
"não provado" e entra no plano como teste pgTAP antes de qualquer troca.

## O risco principal: o mesmo dado escrito em vários lugares

O bug de 2026-10-15 (`f95c9da5`: `is_public` sumiu de uma lista de colunas
copiada em duas rotas, e cada "Salvar" tirou o mentor do catálogo) foi corrigido
com `OWN_PROFILE_COLUMNS`, mas **a lista de "campos do perfil" continua
existindo em 6 formas**, e nada impede que uma delas divirja de novo:

| # | Onde | O que lista | Quem usa |
|---|---|---|---|
| 1 | `lib/schemas/profile.ts` (`updateProfileSchema`) | campos que o formulário pode enviar (32 campos) | `PUT /api/profile` |
| 2 | `lib/services/auth/own-profile-columns.ts` | colunas lidas de `profiles` | `GET/PUT /api/profile` e `GET /api/auth/me` (domínio auth) |
| 3 | `lib/services/mentors/mentor-profile-fields.ts` e `mentees/mentee-profile-fields.ts` | campos editáveis + `*_PROFILE_EMBED` (+`_WITH_CV`) | as mesmas rotas |
| 4 | `app/api/profile/update/route.ts:43-62` | lista própria de 17 campos permitidos, mais `select("*")` | rota **sem nenhum chamador** (ver achado 2) |
| 5 | `app/api/profile/role/route.ts:48-58` | 9 `if (typeof ...)` copiados à mão sobre `profileData` (`z.record(z.any())`) | onboarding |
| 6 | `hooks/useProfile.ts` (`Profile`) e `components/profile/profile-form.ts` (`ProfileFormData`) | tipo do perfil no cliente | formulário |

Nada testa que o que o formulário **escreve** (1) é o que a API **devolve** (2+3).
Foi exatamente essa a falha de 15/10. O plano abaixo começa por um teste de
contrato que cobre isso, antes de mexer em qualquer rota.

Há ainda **dois produtores do mesmo `profile`**: `GET /api/auth/me` (alimenta o
`useAuth().profile`) e `GET /api/profile` (alimenta `useProfile`). Ambos achatam
mentor + mentorado, mas cada um monta o seu select e o seu `cv_url` (um com a RPC
`profile_cv_url` no client do usuário, o outro com `service_role`).

## Camada × estado

| # | Camada | Estado | Prova |
|---|---|---|---|
| 1 | Migration SQL | **parcial** | `mentor_profiles`, `mentee_profiles`, RPCs `request/withdraw_mentor_verification` e `profile_cv_url` estão versionados (`20261004000000`, `20261005000000`). Mas `profiles` (policies de UPDATE/INSERT do próprio usuário e grants por coluna), `user_favorites` (tabela e RLS) e `onboarding_flags` (só o `ADD COLUMN`, `20261007000000`) **não têm policy de escrita em nenhuma migration**; existem no banco e foram criados fora do controle de versão. `user_roles` não tem `unique(user_id, role_id)` (comentário em `stop-mentor/route.ts:52-57`). |
| 2 | Tipos gerados | **parcial** | Tabelas em `lib/types/supabase.ts`. Contornos de tipo: `role/route.ts:44,60,111` (`Record<string, any>`, `from("profiles") as any`), `profile/update/route.ts:43,98,131` (`any`), `stop-mentor/route.ts:41,62,68`, `me/notifications/route.ts:45,71,76` (`from(...) as any`, `any[]`), `me/favorites/route.ts:61` (`as any`), `me/organizations/route.ts:83,109-113`. `profile/route.ts:42` faz cast para o embed. |
| 3 | Entity | **falta** | Não existe `lib/domain/profile/`. O tipo do perfil mora em `hooks/useProfile.ts:15` (hook de cliente) e as regras puras (achatar mentor+mentorado, `verified`/`is_pending_mentor`, montar notificação) estão em helpers de service ou dentro da rota (`notifications/route.ts`, 130 linhas de regra pura). |
| 4 | Zod | **parcial** | `updateProfileSchema` cobre o `PUT /api/profile` (bom). Faltam: `profileData` do `role` é `z.record(z.any())` (`schemas/profile.ts:81`); `onboarding` valida só `!flag \|\| value === undefined` (chave e valor livres gravados em `onboarding_flags`); `request-mentor` valida à mão (`typeof`); `organizationId` do `DELETE /api/me/organizations` e `role` de `notifications` não são validados; nenhum schema de saída. |
| 5 | Repository | **falta** | `.from(...)` direto nas 9 rotas que consultam o banco: `profile/route.ts` (4 pontos), `update` (4), `onboarding` (3), `role` (5 tabelas), `request-mentor` (1), `stop-mentor` (4), `me/favorites` (3), `me/notifications` (2), `me/organizations` (6). `profile/delete` delega para `deleteUserCompletely` (service, não é rota direta). |
| 6 | Ports | **parcial** | Três e-mails chamados direto de `lib/email/brevo`: `sendNewMenteeProfileEmail` (`role`), `sendAdminNewMentorNotification` (`request-mentor`), `sendOrgJoinRequestToAdmin` (`organizations`). Já existe o padrão em `lib/ports/quiz-mailer.ts` + `adapters/quiz-mailer.brevo.ts` a reutilizar. |
| 7 | Service | **falta** | Só há helpers puros (`splitMentorFields`, `withMenteeFields`, `cvLink`). Toda a orquestração mora nas rotas: ordem mentor → mentorado → perfil e o 409 de slug (`profile/route.ts:83-136`), troca de papel mentor/mentee (`role/route.ts:99-157`), regra de notificação (`notifications/route.ts:83-210`), entrar/convite/solicitação em organização (`organizations/route.ts:49-121`). |
| 8 | Route handler | **parcial** | Quatro estilos de erro/auth na mesma pasta: `NextResponse.json({error, details})` (`profile`, `role`, `onboarding`), `ErrorHandler.handleApiError` (`update`), `errorResponse/handleApiError` de `lib/api/error-handler` (`request-mentor`, `stop-mentor`, `organizations`), `NextResponse.json` simples (`favorites`, `notifications`). Autenticação em 3 estilos: sessão, `Bearer` validado com `service_role` (`profile`, `onboarding`, `update`), e sessão sozinha. `profile/route.ts` devolve `details: error.message` do banco ao cliente em todos os 500. Rotas finas: `delete` (23 linhas), `favorites`. Fora do "fino": `role` (169), `notifications` (219), `organizations` (148). |
| 9 | OpenAPI | **falta** | `profile` e `me` estão em `pendingDomains` (`lib/openapi/document.test.ts:26-30`). A dependência `@asteasolutions/zod-to-openapi` já está instalada (`package.json:32`), então não há parada para instalar. |
| 10 | Query layer | **falta** | `hooks/useProfile.ts` (157 linhas) usa `useState` + `fetch` + atualização otimista à mão, sem TanStack. `AuthContext` tem **outro** cache do mesmo perfil (`refreshProfile`) e `MentorPauseToggle`/`MentorPausedBanner` fazem `fetch("/api/profile")` e chamam `refreshProfile()` na mão. `useFavorites` e `useNotifications` têm `queryKey` solta (não há `qk.profile` nem `qk.me`). Nenhum efeito registrado em `lib/query/effects.ts`: salvar o perfil não invalida o catálogo de mentores nem o checklist. |
| 11 | Página e componentes | **parcial** | `app/[locale]/profile/page.tsx` 207 linhas, `components/profile/OrganizationsTab.tsx` 190, `ProfileMentorshipSection.tsx` 157, `ProfileAboutSection.tsx` 163, todos acima de ~150. `OrganizationsTab` e `JoinOrganizationButton` fazem `fetch` direto com a mesma URL em dois lugares. |
| 12 | Testes | **parcial** | Cobertos: `GET /api/profile` (criação do perfil, 5 casos), `role` (7 casos, 316 linhas), `request-mentor` (3 casos), `mentee-profile-fields`, `cv-storage`, `own-profile-columns.test.ts` (só checa que `is_public` está na lista). Sem teste: `PUT /api/profile` (o caminho do bug de 15/10), `update`, `onboarding`, `stop-mentor`, `delete`, as 3 rotas de `me`, `mentor-profile-fields` do lado de escrita. pgTAP: `profiles_access.test.sql` cobre só **leitura** (anon/dono/admin); não há pgTAP de escrita própria de `profiles`, `mentor_profiles`, `mentee_profiles`, `user_favorites`. |
| 13 | Tooling e CI | **n/a** | É do repositório. |
| 14 | Superfície para agentes | **falta (decidir: não expor)** | Sem capability. Perfil próprio tem telefone e e-mail; favoritos e notificações são leitura do próprio usuário. Sugestão: negar por padrão, nada entra em `exposure.ts` nesta onda. |

## Achados que não são "falta de camada"

### Inventário de `service_role` (5 rotas de `profile`, mais 1 em `me`)

| Onde | O que faz com `service_role` | Razão provável | Dá para trocar? |
|---|---|---|---|
| `profile/route.ts` (GET e PUT) | Valida o `Bearer` (`auth.getUser(token)`), lê o próprio perfil, escreve `profiles`, `mentor_profiles` e `mentee_profiles` do próprio usuário, e **cria** o perfil se faltar | Herança de antes das tabelas separadas: o select com `cv_url` (sem grant de leitura para `authenticated`) só funcionava com `service_role`. As escritas dos três não precisam. | **Sim, por RLS, sem migration**, se o pgTAP provar as policies. `GET /api/auth/me` já lê exatamente o mesmo perfil com o client do usuário + RPC `profile_cv_url` (`auth/me/route.ts:36-47`). Os `UPDATE` do próprio perfil já rodam com o client do usuário em `role/route.ts:60` e `stop-mentor/route.ts:77`; `mentor_profiles` em `request-mentor/route.ts:42`; `mentee_profiles` em `role/route.ts:71`. O que **não está provado**: INSERT em `profiles` (fallback do GET), UPDATE de `slug`, e o `Bearer` (ver D1). |
| `profile/update/route.ts` | Idem, com `select("*")` | Mesma herança; é a versão antiga da rota acima | Não importa: **sem nenhum chamador** no app (só aparece em `docs/api-reference.md` e num doc arquivado). Ver D1. |
| `profile/onboarding/route.ts` | Valida o `Bearer`; lê e grava `onboarding_flags` do próprio usuário | Mesma herança | **Sim.** É um `UPDATE` da própria linha de `profiles`, como `stop-mentor` já faz com `is_public`. Nenhum chamador envia `Authorization` (`useOnboarding.ts:81`, `settings/page.tsx:56`). |
| `profile/role/route.ts` | `DELETE` do outro papel e `INSERT` do papel em `user_roles` (e leitura de checagem) | A migration `20261003030000` fechou de propósito a escrita de `user_roles` para usuário comum (escalada para `admin`). Logo, **só `service_role` ou RPC consegue**. | **Não por RLS** (seria reabrir a falha). **Por RPC sim, mas exige migration**: `set_my_role('mentor'\|'mentee')` `security definer`, que ainda resolve o achado 4 (atomicidade). Migration é proibida nesta linha, então vira D2/D3. |
| `profile/stop-mentor/route.ts` | Mesmo `DELETE`/`INSERT` em `user_roles` | Idem | Idem. A RPC `withdraw_mentor_verification` já existe e já é `security definer`; estendê-la para também trocar o papel resolve a rota inteira. |
| `me/organizations/route.ts` (POST) | Lê o e-mail dos admins da organização e o do solicitante para avisá-los | O comentário da rota diz: membro comum não lê outros membros, e o e-mail de terceiros é restrito por RLS. Correto. | **Sim por RPC** (`org_admin_emails(org_id)` `security definer`, migration), ou ficar como exceção documentada dentro de um service. |
| `profile/delete/route.ts` | Via `deleteUserCompletely`, que usa `service_role` | Apagar de `auth.users` exige a Admin API | **Não.** Exceção legítima; está justificada em `docs/domains/reengagement-invites.md §3.3` e no comentário do service, mas **não tem ADR** (o 0005 cobre só o convite por token). |

### Outros achados

1. **A duplicação de lista é o risco que já custou um bug.** Ver a tabela de 6
   formas acima. O plano fecha isso com um teste de contrato (grupo 1).
2. **`/api/profile/update` é código morto perigoso.** Sem chamador no app; usa
   `any`, não passa por Zod, não aceita cookie (só `Bearer`), grava uma terceira lista
   de campos, faz `select("*")` do perfil e não separa campos de mentor (campo de
   mentor enviado aqui é ignorado em silêncio). Apagar arquivo é ponto de parada.
3. **O `Bearer` em `/api/profile` e `/api/profile/onboarding` não tem chamador.**
   Todo `fetch` do app usa cookie de sessão. Se algum cliente externo (app mobile,
   automação) usa, não dá para saber só pelo repositório: conferir nos logs da Vercel
   antes de remover. É ele que obriga a ter `service_role` só para validar o token.
4. **`PUT /api/profile` não é atômico, e o 409 de slug chega tarde.** A ordem é
   mentor → mentorado → perfil. O erro mais provável (slug em uso, `23505`) vem do
   **último** passo, depois de mentor e mentorado já gravados: o usuário recebe 409,
   mas parte do formulário foi salva. `docs/domains/profiles-schema.md` aceitou dois
   `UPDATE` em vez de uma RPC; fazer o `UPDATE` de `profiles` **primeiro** elimina o
   caso comum sem migration e sem mudar a resposta. O select final continua depois
   dos três para voltar o perfil já atualizado.
5. **Trocar de papel não é atômico nem tem trava.** `role`: apaga o papel oposto e
   faz "checar e inserir" em `user_roles` (que não tem `unique`), então dois cliques
   rápidos podem duplicar a linha (o próprio `stop-mentor` documenta isso). Pior:
   `POST /api/profile/role {role: "mentee"}` por um mentor **aprovado** remove o
   papel de mentor sem passar por `withdraw_mentor_verification` nem esconder o
   perfil (`stop-mentor` faz as duas coisas): sobra `mentor_profiles` aprovado +
   `is_public=true` sem o papel. Em `stop-mentor` o papel é removido **antes** da
   RPC; se a RPC falhar, o papel já foi.
6. **Vazamento de mensagem do banco.** `profile/route.ts` devolve
   `details: error.message` (nome de constraint, coluna) em todo 500, e
   `details: error instanceof Error ? error.message` no catch geral.
7. **`onboarding_flags`: ler-modificar-gravar sem trava e chave livre.** Dois tours
   terminando juntos perdem uma flag, e qualquer `flag`/`value` (qualquer JSON, tamanho
   livre) vai para a coluna. O risco de perda é pequeno; o de tamanho vale um limite
   no Zod.
8. **`role` ignora `null` em silêncio, de propósito ou não.** O onboarding envia
   `job_title: null` e `linkedin_url: null` (`onboarding/page.tsx:179-181`); o código
   só grava `typeof === "string"`. Um schema novo tem que usar `.nullish()` e
   **manter** "null = não mexe", senão o onboarding passa a apagar campos.
   `profileUpdates.full_name` (`role/route.ts:146`) nunca é atribuído: sempre cai no
   fallback `"Mentorado"`.
9. **`user_favorites` está fora das migrations**, igual a `mentor_availability` estava
   no domínio mentors: tabela e RLS sem `CREATE`/`POLICY` versionado. A rota deriva
   o `user_id` da sessão (bom), mas a defesa por RLS não é verificável pelo
   repositório. `docs/archive/COMMUNITY_CONTACT_PLAN.md §13` afirma que a RLS "deveria
   escopar", sem prova.
10. **`GET /api/me/notifications` aceita erro de banco como "sem notificações"**
    (`return NextResponse.json({ notifications: [] })` no `catch` e no `error`).
    Mascara falha do banco como lista vazia; é o comportamento atual e o app depende
    de nunca receber 500 ali. Manter, mas logar com contexto.
11. **`toProfileResponse` é `async` sem `await`** (`profile/route.ts:41`) e os testes
    existentes (`route.test.ts`) fazem mock do `@supabase/supabase-js` inteiro porque
    a rota cria o client admin; ao trocar para client do usuário, o mock passa a ser
    do `lib/utils/supabase/server`, bem mais simples.

## Resumo

| Estado | Camadas |
|---|---|
| ok | nenhuma |
| parcial | 1, 2, 4, 6, 8, 11, 12 |
| falta | 3, 5, 7, 9, 10, 14 (decidir: não expor) |
| n/a | 13 |

O dado do perfil em si está bem estruturado (as Fases 0 a 3 de `profiles-schema.md`
fizeram o trabalho de banco). O que falta é (a) um único lugar que diga "quais campos
são do perfil" com um teste que impeça nova divergência, (b) tirar `service_role`
de onde RLS já resolve, e (c) a estrutura de código acima do dado.

---

# Decisões para o Paul

| # | Decisão | Por que trava | Minha sugestão |
|---|---|---|---|
| D1 | Apagar `app/api/profile/update/route.ts` (sem chamador) e remover o suporte a `Authorization: Bearer` de `/api/profile` e `/api/profile/onboarding`? | Apagar arquivo e tirar um modo de autenticar são pontos de parada. Se houver cliente externo com token, ele quebra. | **Sim às duas**, mas só depois de eu (ou o orquestrador) olhar os logs da Vercel dos últimos 30 dias por `Authorization` nessas rotas. Sem o `Bearer`, o `service_role` deixa de ser necessário para autenticar. |
| D2 | `service_role` em `user_roles` (`role`, `stop-mentor`) e na lista de e-mails de admins (`organizations`) e em `delete`: ADR de exceção agora, RPC depois? | Regra do projeto: exceção só com ADR, só dentro de um service. Remover de verdade exige migration, proibida nesta linha. | **ADR 0008 curto agora** (mesmo desenho do 0007): `service_role` nasce só em `*.composition.ts`, o service só aceita `userId` da sessão e o papel `mentor`/`mentee`, nunca `admin`. A RPC `set_my_role` + `org_admin_emails` + `unique(user_id, role_id)` fica numa migration de uma onda futura (D3). |
| D3 | Reservar uma migration de uma onda futura para: versionar `user_favorites` (tabela + RLS), `unique(user_id, role_id)` em `user_roles` (checar duplicatas antes), RPC `set_my_role`, RPC `org_admin_emails`? | Migration é proibida nesta linha; sem ela o pgTAP de favoritos só prova o estado atual e `service_role` de papéis continua. | **Sim, uma migration só, na primeira onda que tiver linha de migration livre.** Esta linha entrega tudo que não depende dela; o pgTAP de favoritos e de escrita do perfil entram agora, rodando contra o estado real do banco. |
| D4 | Dois endurecimentos que mudam resposta: (a) parar de devolver `details: <mensagem do banco>` nos 500 de `/api/profile`; (b) `POST /api/profile/role` com `role: "mentee"` por mentor aprovado passar a responder 409 (e usar `stop-mentor` para rebaixar). | Mudar formato de resposta é ponto de parada. Nenhum chamador do app lê `details` (a tela usa só `error`). (b) muda quem pode fazer o quê. | **(a) sim. (b) sim**, porque hoje o resultado é um mentor aprovado sem papel e ainda público. Os dois ficam em PR separado e pequeno (grupo 5), para o resto da refatoração continuar sem mudar nenhuma resposta. |

---

# Plano

> Modo `plan`: só documento. **Cada grupo é um PR separado**, pequeno o bastante
> para revisar no celular (alvo: menos de ~250 linhas de diff de produção, testes
> à parte), e termina com `npm run verify`. Cada PR deixa o app funcionando e
> **não muda o formato das respostas**, exceto onde marcado (grupo 5, depende de D4).
> Os testes de cada camada entram no mesmo PR. Nenhum grupo precisa de migration.
> Ordem pensada para que o primeiro PR já proteja contra a repetição do bug de
> `is_public`.

## Grupo 1 · Uma só lista de campos + teste de contrato (camadas 3-4)

Mudança pequena, sem tocar em rota. Fecha o risco principal.
- `lib/domain/profile/profile.entity.ts`: `OwnProfile` (tipo do perfil achatado, hoje em `hooks/useProfile.ts`), `PROFILE_WRITABLE_FIELDS` por tabela de destino (profiles / mentor_profiles / mentee_profiles), funções puras `isMentorCandidate`, `hasPublicListing`.
- `lib/schemas/profile.ts`: `roleProfileDataSchema` no lugar de `z.record(z.any())` (9 campos + `learning_goals` + `inclusive_tags`, todos `.nullish()` com `.catch(undefined)` por campo, para manter "tipo errado ou null = não mexe"; achado 8), `onboardingFlagSchema` (chave `^[a-z0-9_-]{1,64}$`, valor string curta/booleano), `requestMentorSchema` (o schema do `organizationId` ficou com a linha org, grupo 7). `UpdateUserRoleInput` passa a vir dos schemas novos.
- **Teste de contrato** (`lib/domain/profile/profile-fields.contract.test.ts`): toda chave de `updateProfileSchema.shape` precisa estar em `OWN_PROFILE_COLUMNS`, em `MENTOR_EDITABLE_FIELDS` ou em `MENTEE_EDITABLE_FIELDS` (`cv_url` explicitamente fora). É o teste que teria pego o bug de 15/10. Só lê os arquivos de mentors/auth, não os altera.
- Risco: baixo. Se o contrato achar um campo hoje divergente, é bug real: registro no relatório em vez de corrigir calado.

## Grupo 2 · Repository e service do perfil próprio (camadas 5-8) · ainda com o mesmo client

Estrutura primeiro, permissão depois: assim um erro de RLS não se mistura com um erro de refatoração.
- Camada 5: `lib/repositories/profile.repository.ts` (interface + fábrica): `findOwn`, `insertOwn`, `updateProfile`, `updateMentorFields`, `upsertMenteeFields`. O `PROFILE_SELECT` (`OWN_PROFILE_COLUMNS` + embeds) nasce **aqui**, uma vez. O embed de mentor vem do `mentor-profile-fields.ts` (reuso, não cópia).
- Camada 7: `lib/services/profile/profile.service.ts` (`getOwn` com criação se faltar, `updateOwn`). Faz o `UPDATE` de `profiles` **primeiro** (achado 4: o 409 de slug deixa de vir depois de gravar mentor/mentorado), depois mentor, depois mentorado, depois o select final. `profile.composition.ts` injeta o client (neste PR ainda o admin atual, explicitamente documentado como temporário até o grupo 4).
- Camada 8: `GET/PUT /api/profile` ficam em auth → Zod → service → status. **Mesmo JSON de hoje**, inclusive `details` (D4 só no grupo 5). Remove o `toProfileResponse` `async` sem `await`.
- Testes: service com repository falso (ordem das escritas, slug duplicado devolve 409 sem ter gravado mentor, `is_public` volta na resposta, criação para conta LinkedIn/Google/e-mail), `route.test.ts` existente adaptado, repository com client falso.
- `own-profile-columns.ts` e `auth/me` **não mudam** (domínio auth). Pedido ao orquestrador: depois que o repository existir, `auth/me` passa a chamá-lo (uma linha na onda do auth).
- Risco: **médio**. É o caminho do bug de 15/10. Mitiga: o teste de contrato do grupo 1 e um teste de rota que faz PUT `{is_public:false}` e confere que a resposta traz `is_public:false` e o resto do perfil intacto.

## Grupo 3 · `onboarding`, `request-mentor`, `delete` finas (camadas 5-8)

- `onboarding`: usa o repository/service do grupo 2 (`getFlags`/`setFlag`/`clearFlags`), `onboardingFlagSchema` do grupo 1. Mesma resposta `{success, onboarding_flags}`. Mantém o `Bearer` até D1.
- `request-mentor`: `requestMentorSchema`; a ordem (RPC → update de abordagem → e-mail ao admin) vai para `mentor-request.service.ts`; e-mail passa pelo port `lib/ports/profile-mailer.ts` + `adapters/profile-mailer.brevo.ts` (copia o desenho de `quiz-mailer`; camada 6 para `sendAdminNewMentorNotification`). Já usa o client do usuário, sem `service_role`.
- `delete`: continua fina; só ganha teste (401, 200 com `filesRemoved`, 500). O `service_role` dentro de `deleteUserCompletely` fica para o ADR (D2).
- Testes: `onboarding` (hoje zero), `request-mentor` mantém os atuais, `delete` novo.
- Risco: baixo.

## Grupo 4 · Trocar `service_role` por RLS em `/api/profile` e `onboarding` (camada 1/12, sem migration) · depende de D1

A parte que reduz privilégio de verdade. Primeiro a prova, depois a troca.
- **pgTAP novo** `supabase/tests/profile_own_writes.test.sql` (não é migration): como `authenticated` com `sub` = dono, prova (1) UPDATE da própria linha de `profiles` incluindo `slug`, `is_public`, `onboarding_flags`; (2) UPDATE da própria `mentor_profiles` (colunas editáveis) e **negado** em `verification_status`; (3) UPSERT da própria `mentee_profiles`; (4) UPDATE da linha de **outra** pessoa afeta 0 linhas; (5) INSERT do próprio `profiles` (fallback do GET). Precisa de Docker: quem roda é o orquestrador/Paul.
- **Parada**: se o item (5) ou o de `slug` falhar, **não troco**: registro qual policy falta e vira migration da D3 (o GET continua com o fallback via `service_role` isolado numa função `provisionProfile`).
- `profile.composition.ts` passa a receber o client da sessão (`createClient` do server); `cv_url` via RPC `profile_cv_url` como em `auth/me`. `MENTEE_PROFILE_EMBED_WITH_CV` deixa de ser usado aqui.
- Com D1 = sim: remove o `Bearer` de `profile` e `onboarding`, e o `auth.getUser(token)` com `service_role`; apaga `profile/update/route.ts`. Com D1 = não: o `Bearer` continua usando um `getUserFromToken` isolado na composição (único ponto com `service_role` na rota) e `update` fica; registro como pendência.
- Testes: rota com client do usuário falso (mock fica só em `lib/utils/supabase/server`), pgTAP acima.
- Risco: **médio-alto** (regressão = ninguém consegue salvar o perfil). Mitiga: PR só desta troca, sem refatoração junto, e o pgTAP rodado antes do merge. Passo manual para você validar no celular: salvar o perfil, alternar "perfil público", terminar um tour.

## Grupo 5 · Papéis e ciclo de mentor (camadas 5-8) · `role` e `stop-mentor`

- `lib/repositories/user-roles.repository.ts` (só `findRoleIds`, `removeRole`, `addRoleIfMissing`), `lib/services/profile/account-role.service.ts` (`chooseRole`, `stopMentoring`). O `service_role` nasce só em `account-role.composition.ts`, conforme o ADR 0008 (D2). O service só aceita `mentor`/`mentee` e o `userId` da sessão.
- Mantém a ordem e os códigos atuais; `role` usa `roleProfileDataSchema`; e-mail de boas-vindas pelo port do grupo 3. `stop-mentor`: chama `withdraw_mentor_verification` **antes** de remover o papel (achado 5), assim uma falha da RPC não deixa o usuário sem papel.
- Testes: os 7 casos de `role` existentes seguem iguais; novos: `stop-mentor` (hoje zero), duas chamadas seguidas não duplicam, `role` nunca recebe `admin`.
- Com D4: (b) rebaixar mentor aprovado via `role: "mentee"` responde 409; (a) `details` do banco sai dos 500 de `/api/profile`. Esse trecho é um **commit separado** dentro do PR (ou PR próprio), para o Paul poder recusar sem desfazer a refatoração.
- Risco: **médio**. Mexe em papel (permissão). Mitiga: nenhum caminho novo escreve em `user_roles` fora do service.

## Grupo 6 · Rotas `me`: favoritos e notificações (camadas 3-8)

Dois PRs, ambos só com cliente de usuário (sem `service_role`):
- **6a favoritos:** `lib/repositories/favorites.repository.ts`, `lib/services/me/favorites.service.ts` (tira o `as any`, usa o tipo gerado), rota fina. `POST` já valida com Zod. Teste de repository/service/rota e **pgTAP** `supabase/tests/user_favorites_access.test.sql` provando que cada um só vê e escreve os seus (contra o estado real; D3 versiona a tabela depois).
- **6b notificações:** `lib/domain/profile/notification.entity.ts` com a regra pura `buildNotifications(appointments, reviewedIds, role, now)` (os 130 linhas de `for` da rota, com `now` injetado para testar a janela de 30 minutos e de 14 dias), `lib/repositories/me-notifications.repository.ts` (as 2 consultas), service fino, rota fina. Mantém `{ notifications: [] }` quando o banco falha (achado 10), agora com `console.error` de contexto. Validação de `role` com `z.enum(["mentor","mentee"]).nullish()` (valor inválido hoje funciona como "sem filtro": manter).
  - Não crio repository em `lib/repositories/appointments*` (é do domínio appointments, regra de posse); o nome `me-notifications` evita conflito e o comentário do arquivo diz para fundir quando o de appointments existir.
- Risco: baixo (favoritos), médio-baixo (notificações, é regra de data; os testes com `now` fixo cobrem).

## Grupo 7 · `me/organizations` · movido para a linha org

Decisão do orquestrador (2026-10-19): a linha org já é dona de `app/api/me/organizations` e de `lib/services/organizations/**` (PR 5 do plano dela, com o port `OrgDirectory`). Esta linha **não toca** nessa rota. Fica registrado aqui só o que a linha org precisa saber: o achado do `service_role` para ler o e-mail dos admins (tabela de inventário acima), o `organizationId` do `DELETE` sem validação de UUID (hoje vira 500 `22P02`) e o ADR 0008 (D2) como lugar da exceção.

## Grupo 8 · Contrato (camada 9)

- `lib/openapi/paths/profile.ts` e `lib/openapi/paths/me.ts`, gerados dos schemas do grupo 1 (entrada) mais um schema de saída `ownProfileSchema` usado **só** no OpenAPI e no teste de contrato (não para validar resposta em runtime: se uma linha antiga tiver valor fora do esperado, não pode virar 500).
- Pedido ao orquestrador (arquivo compartilhado): tirar `"me"` e `"profile"` de `pendingDomains` em `lib/openapi/document.test.ts` e registrar os paths em `lib/openapi/document.ts`.
- Dependência já instalada, **nenhuma parada**. Teste: `npx jest lib/openapi`.
- Risco: baixo.

## Grupo 9 · Cliente (camadas 10-11) · você valida no celular

- Pedido ao orquestrador (compartilhados): `qk.profile` (`own`) e `qk.me` (`favorites`, `notifications(role)`, `organizations`) em `lib/query/keys.ts`; efeitos em `lib/query/effects.ts`: salvar perfil invalida `qk.profile.own`, o perfil do `AuthContext` e `qk.mentors.*`; entrar/sair de organização invalida `qk.me.organizations`.
- `hooks/profile/useOwnProfile.ts` e `useUpdateProfile.ts` (TanStack, atualização otimista via `onMutate`) substituindo `hooks/useProfile.ts`; `MentorPauseToggle` e `MentorPausedBanner` passam a usar a mutation em vez de `fetch` + `refreshProfile()`. `useFavorites`/`useNotifications` trocam a `queryKey` solta por `qk.me.*`. `JoinOrganizationButton` e `OrganizationsTab` compartilham `hooks/me/useMyOrganizations.ts` (hoje fazem o mesmo `fetch` em dois lugares).
- Componentes: `profile/page.tsx` (207), `OrganizationsTab` (190), `ProfileAboutSection` (163), `ProfileMentorshipSection` (157) divididos para ficar abaixo de ~150.
- **Dividir em dois PRs:** 9a hooks + efeitos (`profile` e `me`), 9b divisão dos componentes grandes (puro refactor visual, sem mudar comportamento).
- Testes: hooks, `MentorPauseToggle.test.tsx` (já existe, ajustar mocks); e2e: editar o perfil e ver o catálogo atualizar.
- Risco: **médio**, é UI e o `AuthContext` ainda é uma segunda fonte do perfil. Passo manual: salvar perfil, pausar mentorias, favoritar, entrar numa organização, em tela de celular.

## Grupo 10 · Agentes (camada 14)

Nada a fazer: decisão registrada é **não expor** perfil, favoritos nem notificações em `lib/agents/exposure.ts`.

## Pontos de parada que este plano vai tocar

1. **D1** (apagar `profile/update`, tirar `Bearer`) antes do grupo 4.
2. **D2** (ADR 0008 de `service_role`) antes do grupo 5 (o uso em organizações é da linha org); o ADR é do orquestrador.
3. **D3** (migration futura) não bloqueia nada aqui; o grupo 4 para sozinho se o pgTAP mostrar policy faltando.
4. **D4** (mudança de resposta) só afeta o trecho marcado do grupo 5.
5. O grupo 9 muda a UI: você valida antes de eu seguir.

## Pedidos para arquivos compartilhados (resumo)

| Arquivo | Linha / mudança | Grupo |
|---|---|---|
| `docs/governance/adr/0008-profile-service-role-exceptions.md` | ADR de `service_role` (user_roles, e-mails de admins de organização, delete de conta) | antes do 5 |
| `lib/query/keys.ts` | `profile: { own }`, `me: { favorites, notifications(role), organizations }` | 9 |
| `lib/query/effects.ts` | salvar perfil invalida perfil, `AuthContext` e catálogo; entrar/sair de organização invalida `qk.me.organizations` | 9 |
| `lib/openapi/document.ts` e `document.test.ts` | registrar `profile`/`me`; tirar de `pendingDomains` | 8 |
| `app/api/auth/me/route.ts` (domínio auth) | usar `profileRepository.findOwn` | depois do 2, na linha auth |
| `docs/STATUS.md` | entrada do journal por grupo; atualizar `profiles-schema.md` (parágrafo da escrita em duas tabelas) | cada grupo |
| `messages/*.json` | nenhuma chave nova prevista | - |
