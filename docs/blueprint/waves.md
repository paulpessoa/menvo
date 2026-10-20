# Ondas da modernização (blueprint de 14 camadas)

> Como rodar: skill `menvo-waves` (orquestração e regras contra conflito) +
> skill `menvo-blueprint` (o padrão de cada domínio). Este arquivo é só do
> orquestrador: agentes de linha não o editam.

## Ponto de partida (medido em 2026-10-19)

Rotas em `app/api/<domínio>`, quantas consultam o banco direto (`.from(`),
quantas usam `service_role` e quantas têm `route.test.ts`.

| Domínio | Rotas | Banco direto | service_role | Com teste | Estado |
|---|---|---|---|---|---|
| quiz | 6 | 0 | 1 (ADR 0007) | 6 | no padrão |
| mentors | 3 | 0 | 1 | 3 | no padrão (PR #105) |
| appointments | 12 | 11 | 8 | 6 | falta |
| profile + me | 10 | 9 | 6 | 3 | falta |
| org | 3 | 3 | 1 | 0 | falta |
| admin | 34 | 19 | 9 | 11 | falta |
| feedback | 2 | 2 | 1 | 0 | falta |
| upload, cv | 3 | 3 | 3 | 1 | falta |
| dashboard | 2 | 2 | 2 | 0 | falta |
| chat, community, reports, suggestions, feature-flags, ai | 10 | 6 | 1 | 0 | falta |

Páginas acima de 600 linhas: `mentors/page.tsx` (972), `assistant/page.tsx`
(671), `AdminAppointmentsManager.tsx` (653), `onboarding/page.tsx` (638),
`dashboard/org/page.tsx` (612).

## Ondas

| Onda | Linhas | Migration | Depende de |
|---|---|---|---|
| 0 | Orquestrador: tarefa 2 do `hardening-plan.md` (estatísticas no catálogo), skill `menvo-waves`, `lib/query/keys` e `effects` por domínio | sim (catálogo) | – |
| 1 | **A** appointments (tarefas 3 e 6 do `hardening-plan.md`) · **B** profile + me · **C** org | só A | 0 |
| 2 | admin em 2 linhas (usuários e verificações · o resto) · feedback · tarefas 4 e 5 do `hardening-plan.md` em sequência | uma linha por vez | A |
| 3 | Domínios pequenos (chat, community, upload, cv, dashboard, reports, suggestions, feature-flags, ai) e as páginas acima de 600 linhas | não | 1 |

## Registro

| Data | Onda | Linha | Branch/PR | Observações |
|---|---|---|---|---|
| 2026-10-19 | 0 | catálogo | PR #107 | Migration `20261019000000_mentors_view_public_stats.sql` aplicada em produção; anon passou de 0 para as sessões reais. pgTAP em `supabase/tests/mentors_view_public_stats.test.sql` (não roda no CI; precisa de Docker). |
| 2026-10-19 | 0 | query layer e skill | PR #108 | `lib/query/keys/<d>.ts` e `lib/query/effects/<d>.ts`; `keys.ts` e `effects.ts` só montam. |
| 2026-10-19 | 1 | appointments (segurança) | PRs #109, #110, #117 | `cancel` exige participante; `create` grava em `topic`; trigger `appointments_guard_update` aplicado em produção (transições, ator e participantes). |
| 2026-10-19 | 1 | org | PRs #111–#113, #119, #120 | Entity, Zod, repository, dashboard sobre o repository, página de 612 para 327 linhas. |
| 2026-10-19 | 1 | profile | PRs #114–#116, #121, #122 | Contrato único dos campos, repository e service do perfil, onboarding, request-mentor, favoritos, notificações. |
| 2026-10-19 | 1 | appointments | PRs #123, #124 | Entity do status (tabela de transições) e repositories. |
| 2026-10-20 | 1 | governança | PRs #118, #125, #126 | jest ignora worktrees; prompt de migrations (`docs/operations/supabase-migrations.md`); ADR 0008 aceito. |
