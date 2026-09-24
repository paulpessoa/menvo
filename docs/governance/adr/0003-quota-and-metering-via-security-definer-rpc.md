---
title: "ADR 0003 — Cota, orçamento e medição de IA via RPC security definer no Postgres"
owner: paul
status: current
last_reviewed: 2026-09-24
source_of_truth: [supabase/migrations/20260923000002_ai_usage_and_quota.sql, supabase/migrations/20260923000003_ai_metering_server_key.sql, lib/ai/quota.ts, lib/ai/metering.ts, lib/ai/metering/callback.ts]
---

# ADR 0003 — Cota e medição no Postgres via RPC `security definer`

- **Status:** implementado e aplicado (2026-09-23). Ver o diário do
  `STATUS.md` de 2026-09-23 ("AI Monthly Quota + Cost Metering").
- **Plano:** `AI_PLATFORM_PLAN.md` §1 princípio 2, §5.

## Contexto

O limite anterior do assistente ("30 mensagens/dia") vivia num `Map` em
memória (`lib/rate-limit.ts`). No Vercel, cada instância serverless tem sua
própria memória — na prática, o limite não existia (§0, dívida 1 do plano).
Nenhuma funcionalidade de IA nova podia repetir esse erro, e toda chamada
paga precisava de um registro de custo confiável, não montável pelo client.

## Decisão

1. **Cota e orçamento vivem em tabelas Postgres**, nunca em memória de
   processo: `ai_entitlements` (limite por papel × funcionalidade ×
   período), `ai_quota_ledger` (consumo do usuário no período),
   `ai_budget` (teto global mensal em USD).
2. **Toda leitura/escrita de cota e uso passa por RPC `security definer`**
   que lê `auth.uid()` internamente e ignora qualquer `user_id` vindo do
   client: `consume_ai_quota` (atômica — `insert … on conflict do update …
   where used_count < limit returning`, sem corrida entre abas),
   `get_ai_quota`, `record_ai_usage` (grava uma linha em `ai_usage_events`
   com custo calculado em SQL a partir de `ai_model_pricing`).
3. **Nenhuma policy de insert/update/delete para `authenticated`** nas
   tabelas de cota/uso — a única porta de escrita é o RPC. No pior caso um
   usuário mal-intencionado consome a própria cota mais rápido; não
   consegue devolvê-la, nem tocar na cota de outro usuário, nem forjar
   custo.
4. **`record_ai_usage` exige uma chave de servidor** (`AI_METERING_KEY`, só
   em variável de ambiente, hash em `private.ai_settings`, schema não
   exposto pelo PostgREST) — sem isso, qualquer usuário logado podia
   chamar o RPC direto pela API REST do Supabase com até 10M tokens por
   chamada e esgotar o `ai_budget` de US$ 10/mês com uma única linha forjada
   (~US$ 28). Ver a correção de segurança no diário de 2026-09-23.
5. **`service_role` nunca é usado** para essas tabelas — nem para leitura
   nem para escrita — mantendo a invariante `AGENTS.md` de nunca bypassar
   RLS para uma funcionalidade voltada ao usuário.
6. **Medição por callback do LangChain**, não por coleta manual em cada
   rota: `lib/ai/metering/callback.ts` é anexado a todo modelo criado pelo
   registro (ADR 0004) e emite um `AiCallRecord` por tentativa (sucesso,
   erro ou fallback), agregado e enviado ao `record_ai_usage` uma vez por
   turno (`recordAiCalls`).

## Consequências

- Trocar o limite de uma funcionalidade é uma linha em `ai_entitlements`,
  sem deploy.
- O disjuntor global (`ai_budget`) já faz corte duro em 100%; a degradação
  para um modelo mais barato em 80% (plano §3.4 item 3) ainda não está
  implementada — pendência registrada no `STATUS.md` e na ADR 0004 §10
  (coluna `economy jsonb` por capacidade).
- Chamadas anônimas (quiz público) não tinham como ser medidas até
  `record_ai_usage` aceitar `auth.uid()` nulo com `p_server_key` válida —
  resolvido junto com D8 (ADR 0004 §7.3).
