# Audit + plano: mentors BFF (browser sem Supabase direto)

> Linha `mentors-bff` da onda "browser sem Supabase direto". Complementa
> `docs/blueprint/mentors-audit.md` (que cobre o domínio inteiro; várias linhas
> dele já foram resolvidas: entity, repository, service de perfil e OpenAPI existem).

## Auditoria

Três páginas client chamavam `mentorService` (`lib/services/mentors/mentors.service.ts`),
que usa o client do browser (chave anon) e lê `mentors_view` direto do navegador,
contra a regra 4 do `docs/STATUS.md` (BFF).

| Página | Chamada | Colunas antes |
|---|---|---|
| `appointments/book/[mentorId]` | `getMentorById` | 17 colunas, **sem** filtro `verified`/`is_public` |
| `dashboard/mentee` | `getFavoriteMentors` | 6 colunas, `limit(4)` |
| `mentors` (match por IA) | `getMentorsByIds` | 21 colunas; filtrava ids que não eram UUID |

Camadas já prontas e reaproveitadas: entity `PublicMentor`, `createMentorsRepository`
(`findPublicBySlugOrId`), `mentor-profile.service`/`composition`, `mentorSlugParamSchema`,
`lib/openapi/paths/mentors.ts`, `qk.mentors`.

## Decisões

1. **Uma seleção só.** As duas listas viram `PUBLIC_MENTOR_FIELDS` (a mais completa e a
   única sem e-mail/telefone/external_id). Sem parâmetro `fields`: os dois usos cabem.
2. **Filtro do diretório (`verified` + `is_public`) nas duas rotas.** `getMentorById` não
   filtrava; agora mentor oculto ou não verificado dá 404 no agendamento. Mais seguro,
   e o diretório só leva a mentores listados. Mudança de comportamento intencional.
3. **Rotas públicas**, client de servidor (RLS), nunca `service_role`.
4. **Ids inválidos:** a rota é estrita (400 se algum id não for UUID, máx. 50). O hook
   `useMentorsByIds` filtra ids alucinados pela IA antes de chamar, preservando o
   comportamento antigo ("um id inventado não derruba os válidos").
5. **Limite de 4 favoritos** passou para a página (`favorites.slice(0, 4)`), porque a rota
   é genérica.
6. **Erro de banco = 500**, não 404 (o `findPublic` do service engole o erro; o novo
   `getPublicMentor` deixa propagar).
7. Capability de agente: não criada. `mentors.search` já cobre a busca; estas rotas são
   para telas do próprio app.

## Plano / feito

| Camada | Arquivo |
|---|---|
| 4 Zod | `lib/schemas/mentors.ts` (`mentorsByIdsQuerySchema`, `publicMentorSchema`, respostas) |
| 5 Repository | `findPublicByIds` em `lib/repositories/mentors.repository.ts` (1 consulta, sem N+1) |
| 7 Service | `getPublicMentor`, `listPublicMentors` em `mentor-profile.service.ts` |
| 8 Route | `app/api/mentors/route.ts`, `app/api/mentors/[slug]/route.ts` |
| 9 OpenAPI | `GET /api/mentors`, `GET /api/mentors/{slug}` em `lib/openapi/paths/mentors.ts` |
| 10 Query | `qk.mentors.byIds`/`detail` (`lib/query/keys/mentors.ts`), `hooks/mentors/useMentor.ts`, `useMentorsByIds.ts` |
| 11 Páginas | as três páginas trocadas para os hooks |
| 12 Testes | repository, service, 2 rotas, hooks (co-localizados) |

Removidos de `mentors.service.ts` (sem uso): `getMentorById`, `getFavoriteMentors`,
`getMentorsByIds`. O arquivo continua (usado por `lib/services/assistant/tools.ts`).

## Handoff

- `community/page.tsx` ainda importa `mentorService` sem usar (outra linha).
- `mentors.service.ts` ainda tem `getMentors`, `getFilterOptions`, `getMentorReviews`
  (client do browser); verificar se têm consumidor e migrar/apagar na próxima linha.
- `mentors/page.tsx`: os perfis da IA entram como `MentorProfile[]` por cast
  (`as unknown as`), igual ao `any[]` antigo; trocar por `PublicMentorDto` quando a
  página for quebrada (972 linhas).
- Verificação feita: `npx tsc --noEmit` e `npx jest mentors`. Sem build nem e2e.
