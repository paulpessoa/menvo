# Plano de robustez: padrões para consolidar (out/2026)

> **Para quem é:** qualquer agente (Claude Code, Codex, Cursor, etc.) ou pessoa
> que vá executar estas tarefas. Cada tarefa abaixo é **autocontida**: dá para
> copiar a seção inteira como pedido, sem precisar de outra conversa.
> **Origem:** revisão de padrões de 2026-10-15 (ver `docs/STATUS.md`).
> **Regras que valem para todas:** `AGENTS.md` (RLS sempre, sem `service_role`
> em fluxo de usuário, Zod nas fronteiras, JSDoc explicando o porquê, testes ao
> lado do arquivo, Conventional Commits, **nenhuma atribuição a IA**,
> `npx tsc --noEmit` e `npm run build` antes de qualquer commit).

## Por que este plano existe

Os padrões certos já estão escolhidos e documentados (ADR 0006, skill
`menvo-blueprint`), mas a adoção é desigual. Medido em 2026-10-15:

| Medida | Valor |
|---|---|
| Rotas em `app/api` | 108 |
| Rotas que consultam o banco direto (`.from(`) | 60 |
| Rotas que usam `service_role` | 34 |
| Componentes que chamam `/api` com `fetch` direto | 41 (contra 14 usos de `useQuery`) |
| Arquivos `.tsx` com mais de 300 linhas | 30 |

O risco principal é **duplicação**, não falta de padrão. Dois bugs de produção
de 2026-10-15 vieram daí:

1. `is_public` sumiu de uma lista de colunas copiada em duas rotas; salvar o
   perfil passou a tirar mentores do catálogo (corrigido em `f95c9da5`).
2. A view `mentor_stats` é `security_invoker`; visitantes viam 0 sessões e o
   certificado público não abria (corrigido com `mentor_public_stats`).

## Ordem e esforço

Estimativas em **dias de trabalho com agente**, incluindo revisão e teste
manual. Faça uma tarefa por branch/PR, nesta ordem.

| # | Tarefa | Esforço | Por que nesta posição |
|---|---|---|---|
| 1 | Testes de contrato do banco (pgTAP) | 1–2 dias | Barato, não muda comportamento, pega a classe de bug de hoje |
| 2 | Estatísticas públicas no catálogo | 0,5 dia | Mesmo bug do certificado, ainda aberto no catálogo |
| 3 | Máquina de estados da sessão de mentoria | 3–4 dias | Coração do produto; base para 4 e 5 |
| 4 | Funil de eventos de produto | 2 dias | Mostra onde as pessoas se perdem; usa os estados da 3 |
| 5 | Eventos de domínio com outbox (e-mails) | 4–5 dias | E-mails confiáveis com nova tentativa; depende da 3 |
| 6 | Repositório de appointments + rotas finas | 3 dias | Aplica o blueprint ao domínio mais usado |

**Primeira onda (1 a 4): cerca de 1,5 semana.** A 5 e a 6 fecham em mais 1,5
semana. Ficam para depois, quando houver dados ou cliente: matching que aprende
com o check-in (precisa de 4 a 6 semanas de check-ins) e limites por
organização (precisa do primeiro cliente B2B).

---

## Tarefa 1 · Testes de contrato do banco (pgTAP)

**Contexto.** As regras de acesso (RLS, views `security_invoker`, funções
`security definer`) são a fronteira de segurança do Menvo, mas só duas
migrations têm teste (`supabase/tests/mentor_availability.test.sql`,
`supabase/tests/appointment_checkins.test.sql`). Uma view que muda de
comportamento por papel passa despercebida.

**Objetivo.** Um teste pgTAP por objeto público crítico, provando o que cada
papel (`anon`, `authenticated` dono, `authenticated` outro, admin) enxerga.

**Fazer.**
- Criar `supabase/tests/profiles_access.test.sql`: `anon` lê só perfis
  públicos; o dono lê o próprio `is_public` e `onboarding_flags`; outro usuário
  não lê `email`/`phone` de terceiros.
- Criar `supabase/tests/mentor_public_stats.test.sql`: visitante vê os totais
  de um mentor público e aprovado; não vê nada de mentor não público; a função
  nunca devolve linhas individuais.
- Criar `supabase/tests/appointment_feedbacks_access.test.sql`: documentar o
  estado atual. **Atenção:** a policy `"Users can view feedbacks"` tem
  `using (true)` para `authenticated`, então qualquer logado lê `private_notes`
  de todas as avaliações. Escreva o teste do comportamento **desejado**
  (só o autor, o avaliado e o admin leem `private_notes`), deixe-o falhando e
  corrija na mesma tarefa com uma migration que troca a policy (leitura pública
  só de `rating`/`public_feedback` aprovados, via view ou função).
- Seguir o formato dos testes existentes: `begin; ... select * from finish(); rollback;`,
  fixtures com UUIDs fixos, `set local role` e `request.jwt.claim.sub`.

**Aceite.** `supabase test db` passa localmente (Docker). Se não houver Docker,
rodar cada arquivo contra o banco remoto **dentro de `begin ... rollback`**
com `npx supabase db query --linked -f <arquivo>` e conferir `num_failed() = 0`.

**Fora do escopo.** Mudar qualquer outra policy além de `appointment_feedbacks`.

---

## Tarefa 2 · Estatísticas públicas no catálogo

**Contexto.** `mentors_view` junta `mentor_stats`, que é `security_invoker`:
para visitantes, todo mentor aparece com 0 sessões e 0 avaliações em
`/mentors` e no perfil público. O certificado já usa
`public.mentor_public_stats(p_mentor_id)` (migration
`20261015030000_mentor_public_stats.sql`), que devolve só agregados de mentores
públicos e aprovados.

**Objetivo.** Catálogo, cards e perfil público mostram as mesmas estatísticas
para visitantes, logados e o próprio mentor.

**Fazer.**
- Migration que recria `mentors_view` trocando o `left join mentor_stats` por
  `left join lateral public.mentor_public_stats(p.id) ms on true`, mantendo
  **exatamente** as mesmas colunas e nomes (`average_rating`,
  `total_sessions`, `total_reviews`). Conferir com `pg_get_viewdef` antes e
  depois.
- Regenerar `lib/types/supabase.ts` (`npx supabase gen types typescript --linked --schema public`).
- Teste pgTAP: `anon` vê `total_sessions` > 0 para um mentor com sessão concluída.

**Aceite.** Abrindo `/mentors` sem login, um mentor com sessões concluídas
mostra o número certo. Consulta: `set local role anon; select slug, total_sessions from mentors_view;`.

**Fora do escopo.** Mudar o visual dos cards.

---

## Tarefa 3 · Máquina de estados da sessão de mentoria

**Contexto.** O status de `appointments` (`pending`, `confirmed`, `completed`,
`cancelled`) é alterado em pelo menos 12 lugares, cada um com sua própria regra:
`app/api/appointments/{action,complete,confirm,create,mark-completed,no-show,schedule,cancel}`,
`app/api/cron/appointments`, `lib/services/mentorship/mentorship.service.ts`,
`lib/services/assistant/tools.ts`, `lib/services/appointments/admin-appointments.service.ts`
e a função SQL `resolve_appointment_checkin`. Nada impede transições
impossíveis (ex.: `cancelled` → `completed`).

**Objetivo.** Um único lugar define as transições válidas; todo o resto pede a
transição e recebe erro se ela não for permitida.

**Fazer.**
- `lib/domain/appointments/appointment-status.entity.ts`: tipo dos estados,
  tabela de transições (de → para → quem pode: mentor, mentorado, sistema,
  admin) e `assertTransition(from, to, actor)` pura. Teste cobrindo a tabela
  inteira.
- No banco: trigger `before update of status on appointments` que recusa
  transições fora da tabela (a mesma tabela, em SQL), para que nenhuma rota,
  cron ou função escape da regra. Teste pgTAP.
- Trocar cada `update({ status: ... })` dos arquivos listados por uma chamada
  que valida antes, sem mudar o comportamento atual que é válido.
- Documentar a tabela em `docs/domains/scheduling.md` (diagrama mermaid).

**Aceite.** Testes Jest e pgTAP da tabela passam; os testes existentes de
rotas continuam passando; uma tentativa de `cancelled → completed` falha no
banco com mensagem clara.

**Fora do escopo.** Novos estados (ex.: `no_show` separado de `cancelled`)
entram só se a tabela mostrar que são necessários; aí, propor antes de criar.

---

## Tarefa 4 · Funil de eventos de produto

**Contexto.** Não dá para ver onde as pessoas se perdem. Em 2026-10-15, os 4
cadastros da semana estavam com perfil vazio e só 1 tinha agendado; isso só foi
descoberto com consultas manuais.

**Objetivo.** Painel admin com o funil por semana: cadastrou → completou perfil
→ fez quiz → agendou → sessão aconteceu (check-in) → avaliou → avançou
(follow-up, quando existir).

**Fazer.**
- Calcular a partir das tabelas que já existem (`profiles`, `quiz_responses`,
  `appointments`, `appointment_checkins`, `appointment_feedbacks`); não criar
  tabela de eventos nesta tarefa.
- Função SQL `security definer` só para admin (`public.is_admin()`) que devolve
  contagens por semana e etapa, sem dados pessoais.
- Página `/dashboard/admin/funnel` com tabela e barras (seguir o padrão visual
  de `/dashboard/admin/ai-usage`).

**Aceite.** Os números batem com consultas manuais para duas semanas
escolhidas; nenhum e-mail ou nome sai da função.

**Fora do escopo.** Analytics de clique (Clarity já cobre).

---

## Tarefa 5 · Eventos de domínio com outbox

**Contexto.** E-mails transacionais saem no meio das rotas (`lib/email/brevo.ts`
chamado direto). Se o Brevo falha, ninguém tenta de novo, e a rota às vezes já
gravou a mudança. Retenção e check-in resolveram isso cada um do seu jeito
("claim" + rollback).

**Objetivo.** Mudanças importantes gravam um evento na mesma transação; um
worker entrega os efeitos (e-mail, notificação) com nova tentativa.

**Fazer.**
- Tabela `domain_events` (id, type, aggregate_id, payload jsonb sem dados
  sensíveis além de ids, created_at, processed_at, attempts, last_error) com
  RLS sem acesso de cliente.
- Gravar os eventos a partir do trigger da Tarefa 3 (`appointment.confirmed`,
  `appointment.cancelled`, `appointment.completed`).
- Cron `/api/cron/domain-events` (falha fechado sem `CRON_SECRET`, como
  `account-retention`) que processa em lote, com reivindicação atômica
  (`processed_at is null` + `attempts < 5`).
- Migrar **um** e-mail primeiro: confirmação de agendamento. Os outros ficam
  para PRs seguintes.

**Aceite.** Derrubar o Brevo (chave inválida em teste) não perde o e-mail: ele
sai na execução seguinte. Teste do worker com Supabase e Brevo mockados.

**Fora do escopo.** Fila externa (Inngest, QStash); o cron basta no volume atual.

---

## Tarefa 6 · Repositório de appointments e rotas finas

**Contexto.** O blueprint de 14 camadas foi aplicado em quiz e mentors
(`docs/blueprint/quiz-audit.md`, `mentors-audit.md`). Appointments é o domínio
mais usado e o mais espalhado (ver Tarefa 3).

**Objetivo.** `lib/repositories/appointments.repository.ts` como único ponto
que toca `appointments`; rotas só fazem auth, Zod e status HTTP.

**Fazer.** Usar a skill `menvo-blueprint`: "modo audit appointments", revisar o
relatório, depois "modo apply appointments 1-8". Cada `service_role` que
continuar precisa de justificativa num ADR, como o ADR 0007 fez para o quiz.

**Aceite.** "modo verify appointments" sem pendências; nenhuma mudança de
formato nas respostas das rotas (testes existentes passam sem edição).

---

## Registro

| Data | Tarefa | PR/commit | Observações |
|---|---|---|---|
| 2026-10-15 | 1 · pgTAP | PR #106 | Contratos de `profiles`, `mentor_public_stats` e `appointment_feedbacks`. Não rodam no CI (precisam de Docker). |
| 2026-10-19 | 2 · Estatísticas no catálogo | `fix/catalog-public-stats` | `mentors_view` lê `mentor_public_stats`; mentor fora do catálogo cai no `mentor_stats` de antes. Aguardando aplicação da migration. |
| | 3–6 | | Seguem pelas ondas em [`waves.md`](waves.md). |
