# Audit do domínio mentors (14 camadas)

> Modo `audit`: só leitura, nenhum código mudou. Data: 2026-10-06.
> Legenda: **ok** = cumpre a regra da camada; **parcial** = existe mas foge da
> regra; **falta** = não existe. A coluna "Prova" é o arquivo que sustenta o estado.

Escopo lido: `app/api/mentors/**` (5 rotas), `lib/services/mentors/`,
`app/actions/mentors.ts`, `hooks/useMentors.ts`, `lib/types/models/mentor.ts`,
`lib/schemas/availability.ts`, `lib/agents/capabilities/mentors.ts`,
`app/[locale]/mentors/**`, as migrations que citam `mentors_view`,
`mentor_profiles`, `mentor_availability` e `mentor_visibility_settings`, e os testes.

## Os dados do domínio passam por quatro caminhos diferentes

Antes da tabela, o achado principal: o mesmo dado (`mentors_view`) é lido por
quatro caminhos, cada um com seu jeito.

| Caminho | Onde | Quem usa |
|---|---|---|
| Service **no navegador** consultando o banco direto | `lib/services/mentors/mentors.service.ts` (590 linhas, `createClient` do browser) | `hooks/useMentors.ts` → `mentors/id/*`; `mentors/page.tsx:322` (`getMentorsByIds`) |
| Server actions | `app/actions/mentors.ts` (busca, filtros, reviews, slugs) | `mentors/page.tsx`, `hooks/quiz/useMentorSlugs.ts` |
| Service de servidor | `mentor-public.service.ts`, `home-highlights.ts` | `mentors/[slug]/page.tsx`, home |
| Rotas de API | `app/api/mentors/**` | `MentorProfileClient`, `MentorActivationChecklist`, `mentorship.service` |

O padrão do quiz resolve isso com **um** repository e **um** service, usados
pelas rotas, pelas actions e pelos Server Components.

## Camada × estado

| # | Camada | Estado | Prova |
|---|---|---|---|
| 1 | Migration SQL | **parcial** | `mentors_view` e `mentor_profiles` estão versionados (última: `20261005010000_mentee_profiles_contract.sql`). Mas `mentor_availability` e `mentor_visibility_settings` **não têm `CREATE TABLE` nem política RLS em nenhuma migration**: existem no banco (estão em `lib/types/supabase.ts`) e foram criados fora do controle de versão. Não deu para confirmar as políticas reais daqui (MCP do Supabase indisponível nesta sessão). |
| 2 | Tipos gerados | **parcial** | Tabelas presentes em `lib/types/supabase.ts`, mas há vários `as any` contornando o tipo: `mentors.service.ts:356,463,534,557`, `home-highlights.ts:66`, `visibility/route.ts` (`.from("mentor_visibility_settings" as any)`, `.returns<any>()`). |
| 3 | Entity | **falta** | Não existe `lib/domain/mentors/`. `lib/types/models/mentor.ts` (54 linhas) tem interfaces escritas à mão. `mentor-public.service.ts` define outro tipo (`PublicMentorData`) e `tools.ts` define `mentorCardDto`/`mentorLlmDto`: três formatos do mesmo mentor. |
| 4 | Zod | **parcial** | Só `setAvailabilitySchema` (`lib/schemas/availability.ts`). `settings` valida à mão (`typeof chatEnabled`), `visibility` valida à mão, `approach` valida UUID com regex inline, `lookup` não valida. Nenhum schema de saída. |
| 5 | Repository | **falta** | `.from(...)` direto em todas as 5 rotas, nos 3 services, nas actions e no service do navegador. `mentors_view` é consultado em pelo menos 10 lugares. |
| 6 | Ports | **n/a** | O domínio não chama serviço externo (sem e-mail, storage ou IA nas rotas). |
| 7 | Service | **parcial** | `mentor-public.service.ts` é de servidor e fino (bom ponto de partida). `mentors.service.ts` é do navegador, com regra de filtro e paginação. As regras de "quem é mentor" ficam nas rotas (`visibility` consulta `user_roles` duas vezes). |
| 8 | Route handler | **parcial** | Três estilos de erro: `errorResponse/handleApiError` (`approach`, `visibility`), `NextResponse.json` à mão (`settings`, `availability`, `lookup`). Só `availability` usa Zod. Nenhuma passa por um service. |
| 9 | OpenAPI | **falta** | `mentors` está em `pendingDomains` (`lib/openapi/document.test.ts`). |
| 10 | Query layer | **parcial** | `qk.mentors.slugs` existe (`lib/query/keys.ts:18`). O resto usa chaves soltas em `hooks/useMentors.ts` (`['mentors', filters]`, `['mentor-filter-options']`, `['mentor', id]`). Não há efeito registrado em `effects.ts`: salvar disponibilidade não invalida o perfil público nem o checklist do mentor. |
| 11 | Página e componentes | **parcial** | `mentors/page.tsx` tem **972 linhas** e busca no `useEffect`; `MentorProfileClient.tsx` tem 572. Existem duas páginas de perfil: `mentors/[slug]` (atual, Server Component) e `mentors/id` + `mentors/id/schedule` (antigas, client, via `useMentor`). |
| 12 | Testes | **parcial** | Só `availability/route.test.ts` (6 casos) e `mentor-profile-fields.test.ts`. Sem teste: `approach`, `visibility`, `settings`, `lookup`, `mentors.service`, `mentor-public.service`, actions. Sem pgTAP. E2E: o smoke só confere que `/mentors` responde 200. |
| 13 | Tooling e CI | **n/a** | É do repositório. |
| 14 | Superfície para agentes | **parcial** | `mentors.search` e `mentors.availability` existem em `lib/agents/capabilities/mentors.ts`, mas chamam `searchMentors`/`getMentorAvailability` de `lib/services/assistant/tools.ts`, não um service do domínio. Quando o service existir, as capabilities devem passar a chamá-lo. |

## Achados que não são "falta de camada"

1. **`service_role` sem ADR, com fallback silencioso para a chave anônima.**
   `app/api/mentors/availability/route.ts:6` usa
   `SUPABASE_SERVICE_ROLE_KEY || NEXT_PUBLIC_SUPABASE_ANON_KEY` para ler **e
   escrever**. Se a chave faltar, a rota troca de permissão sem avisar. A escrita
   é limitada a `user.id` (não dá para alterar a agenda de outro mentor), mas
   ignora o RLS. `mentor-public.service.ts` também usa `service_role` para ler
   a disponibilidade. Ponto de parada: precisa de ADR ou de uma política RLS de
   leitura pública para `mentor_availability`, o que torna o `service_role`
   desnecessário.
2. **`GET /api/mentors/availability?mentor_id=X` é público e retorna `select("*")`**
   via `service_role`, para qualquer id, inclusive de quem não é mentor
   verificado ou público. O perfil público filtra `verified` e `is_public`; esta
   rota não.
3. **Salvar a disponibilidade não é atômico.** O `POST` apaga todos os horários e
   depois insere os novos. Se o insert falhar, o mentor fica sem agenda. Uma
   função SQL (RPC) com transação resolve.
4. **Rotas sem uso no app:**
   - `/api/mentors/lookup`: substituída por `resolveMentorSlugsAction`.
   - `/api/mentors/visibility`: só aceita `"public"`; o próprio código diz
     "always public now". A tabela `mentor_visibility_settings` também não tem
     migration.
   - `/api/mentors/settings`: nenhum `fetch` no app chama essa rota.
   Apagar é ponto de parada: confirme antes que nenhum cliente externo (app,
   automação) as usa.
5. **Páginas `mentors/id` e `mentors/id/schedule`** parecem duplicar
   `mentors/[slug]`. São as únicas que usam `useMentor` e o service do navegador.

## Resumo

| Estado | Camadas |
|---|---|
| ok | nenhuma |
| parcial | 1, 2, 4, 7, 8, 10, 11, 12, 14 |
| falta | 3, 5, 9 |
| n/a | 6, 13 |

Ao contrário do quiz, onde o dado já estava bem protegido, aqui há trabalho
na camada 1: duas tabelas fora das migrations e um `service_role` com
fallback. A sugestão é resolver isso **antes** de mover código.

## Decisões para o Paul

| # | Pergunta | Sugestão |
|---|---|---|
| D1 | Apagar `/api/mentors/lookup`, `visibility` e `settings` (e a tabela `mentor_visibility_settings`)? | Sim, depois de confirmar que nada externo usa. Menos superfície, menos camadas para migrar |
| D2 | `mentor_availability`: política RLS de leitura pública (só mentor verificado e público) e escrita só do dono, em vez de `service_role`? | Sim. Remove o achado 1 e o 2 de uma vez |
| D3 | Salvar a agenda por RPC transacional? | Sim, junto com D2 |
| D4 | Apagar as páginas `mentors/id/*`? | Verificar se algum link ainda aponta para elas; se não, sim |
| D5 | Unificar os quatro caminhos de leitura num repository + service de servidor, mantendo as server actions como "rotas" da página? | Sim. É o mesmo desenho do quiz |

Próximo modo sugerido: `modo plan mentors`, depois das respostas de D1 a D5.

---

## Execução (2026-10-06)

Decisões D1 a D5 aprovadas pelo Paul. Feito nesta branch:

| Camada | O que mudou |
|---|---|
| 1 | `20261008000000_mentor_availability_rls_and_rpc.sql`: tabela versionada, políticas antigas trocadas por leitura pública (aprovado + público), leitura e escrita do dono, e a RPC transacional `set_mentor_availability`. `20261008000100_drop_mentor_visibility_settings.sql` (D1) |
| 3 | `lib/domain/mentors/availability.entity.ts` e `mentor.entity.ts` (campos públicos explícitos, `isMentorId`, `displayName`) |
| 4 | `lib/schemas/availability.ts` (query e saída), `lib/schemas/mentors.ts` |
| 5 | `mentor-availability.repository.ts`, `mentors.repository.ts` |
| 7 | `mentor-availability.service.ts` e `mentor-profile.service.ts`, cada um com sua composição. Nenhum usa `service_role` |
| 8 | `availability` e `[slug]/approach` finas; `lookup`, `visibility` e `settings` removidas (D1) |
| 9 | `lib/openapi/paths/mentors.ts`; `mentors` saiu de `pendingDomains` |
| 11 | Páginas `mentors/id` e `mentors/id/schedule` removidas (D4); `[slug]/page.tsx` usa o service |
| 12 | pgTAP `supabase/tests/mentor_availability.test.sql` (10 casos) e testes de entity, repository, service e rotas |
| 14 | `getMentorAvailability` (tool do agente) usa o service de perfil com o client de quem chamou |

**Ainda pendente (D5, segunda etapa):** a busca do catálogo. `mentors.service.ts`
(navegador, 590 linhas) continua usado por `mentors/page.tsx` (972 linhas),
`community/page.tsx`, `appointments/book/[mentorId]` e `dashboard/mentee`, e
`app/actions/mentors.ts` ainda consulta `mentors_view` direto em
`searchCatalogAction` e `getCatalogFilterOptionsAction`. Essa etapa mexe em
camadas 10 e 11 (query keys e páginas grandes) e merece um PR próprio, com
teste E2E do catálogo usando dados reais.
