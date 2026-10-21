# Audit, plano e handoff do domínio community

> Onda "browser sem Supabase direto". Escopo: mural `/community` (mentorados para mentor/admin).

## Auditoria (antes)

| # | Camada | Estado | Prova |
|---|---|---|---|
| 4 | Zod | falta | `CommunityProfile` era interface à mão no service; sem validação de `ids` |
| 5 | Repository | falta | `community.service.ts` fazia `supabase.from("profiles" / "mentee_profiles" / "mentors_view")` e usava `as any` |
| 7 | Service | parcial | usava `createClient()` do browser (chave anon). No servidor (`app/actions/community.ts`) isso rodava sem sessão |
| 8 | Route | falta | `getProfilesByIds` lia `profiles` direto do navegador (`page.tsx:228`): dado pessoal exposto ao client |
| 9 | OpenAPI | falta | sem `lib/openapi/paths/community.ts` |
| 10 | Query | falta | sem keys nem hook |
| 11 | Página | parcial | 548 linhas; `mentorService` importado e não usado |

Login: `/community` não está em `protectedRoutes` (middleware não exige), mas a página usa
`<RequireRole roles={["mentor","admin"]}>` e `searchCommunityAction` devolve erro sem mentor/admin.
Decisão: a rota exige login (401). O RLS ("Public profiles visibility restricted") já limita
mentorados a mentor/admin; a rota não duplica a checagem de papel.

Colunas (`COMMUNITY_COLUMNS`): `id, full_name, avatar_url, bio, job_title, company, linkedin_url,
github_url, languages, expertise_areas, mentorship_topics, slug` + embed de `mentee_profiles`
(instituição, curso, nível, formatura, metas). Sem e-mail, telefone, idade, endereço nem CV
(`cv_url` sempre null). Nada sensível além de nome, foto e links sociais, que o próprio usuário
publicou (`is_public`).

## Plano e o que foi feito (um commit)

1. Zod `lib/schemas/community.ts`: `ids` (CSV, máx. 50, descarta não-UUID como antes), perfil e resposta.
2. Repository `lib/repositories/community.repository.ts`: toda leitura de banco, sem `any`.
3. Service `lib/services/community/community.service.ts` por injeção + `community.composition.ts`;
   `app/actions/community.ts` passa o client de servidor (cookie).
4. Rota `GET /api/community/profiles?ids=a,b` -> `{ profiles }` / `{ error }` (401, 400, 500).
5. OpenAPI `lib/openapi/paths/community.ts`; keys `lib/query/keys/community.ts`.
6. Hook `hooks/community/useCommunityProfilesByIds.ts` (mutation, disparada pela resposta da IA); página trocada.
7. Testes co-localizados: schema, repository, service, rota, hook.

Sem migration, sem `service_role`, sem dependência nova.

## Handoff

- Pendente (arquivos compartilhados): `lib/query/keys.ts` (`import { communityKeys } from "./keys/community"` e `community: communityKeys,` em `qk`); `lib/openapi/document.ts` (`import "./paths/community"` e tag `community`); `lib/openapi/document.test.ts` (mover `community` de `pendingDomains` para `documentedDomains` só junto de documentar `POST /api/community/contact`).
- `app/api/community/contact/route.ts` usa `service_role` (lê e-mail do mentorado via `auth.admin`) e não tem ADR; fora do escopo desta linha.
- A busca do mural continua por server action (`searchCommunityAction`), não por rota HTTP; a página tem 548 linhas e só a parte do match foi tocada.
- MCP: perfis de pessoas não foram expostos a agentes.