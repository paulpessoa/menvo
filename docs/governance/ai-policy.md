---
title: "Política de IA — modelos permitidos, orçamento, dados e retenção"
owner: paul
status: current
last_reviewed: 2026-09-24
source_of_truth: [lib/ai/models/defaults.ts, supabase/migrations/20260923000002_ai_usage_and_quota.sql, docs/AI_PLATFORM_PLAN.md]
---

# Política de IA (interna)

Versão interna correspondente ao que `AI_PLATFORM_PLAN.md` §12.3 planeja
publicar como conteúdo voltado ao usuário (`/privacy`, `kb/politicas/`).
Esta página é a referência de quem implementa; o texto para o usuário final
deve ser revisado por um advogado com experiência em LGPD antes de publicar.

## 1. Provedores e modelos permitidos

Só entram no registro (`lib/ai/models`, [ADR 0004](adr/0004-model-registry-by-capability.md))
modelos de provedores com **tier pago ativo** (Google, Groq, OpenAI — ver
`AI_PLATFORM_PLAN.md` §11.1 para a tabela de preços atual). Tiers
gratuitos são proibidos em produção: os termos desses tiers costumam
permitir que o provedor use o conteúdo para melhorar produtos, e o
diagnóstico contém dados pessoais e privados (visão de carreira, resposta
sobre vida pessoal).

Trocar o modelo de uma capacidade é uma linha em `ai_model_config`
(`UPDATE`), sem deploy — mas **só depois** do eval correspondente
(`AI_PLATFORM_PLAN.md` §7) passar com o novo modelo.

Modelos aposentados e por quê: `qwen/qwen3.8-27b` (Groq, mais caro que o
Gemini em uso, nunca chegou a ser usado de fato), `gpt-3.5-turbo` (OpenAI,
legado). Nenhum dos dois é referenciado em `lib/`, `app/` ou
`supabase/functions/` desde 2026-09-23 (ADR 0004 §7).

## 2. Orçamento

- Teto global: **US$ 10,00/mês**, em `ai_budget`, editável pelo admin.
  Revisar com o painel `/dashboard/admin/ai-usage` depois do primeiro mês
  completo de dados.
- Em 100% do orçamento: corte duro para todo usuário não-admin (a busca
  normal, sem IA, continua funcionando).
- Em 80% do orçamento: degradação automática para o modelo mais barato de
  cada capacidade — **ainda não implementado**. Pendência registrada na
  ADR 0004 §10 (coluna `economy jsonb`) e no `STATUS.md`.
- Cada usuário tem limites próprios em `ai_entitlements` (por papel ×
  funcionalidade × mês-calendário `America/Sao_Paulo`), verificados **antes**
  do orçamento global.

## 3. Dados que podem ir ao modelo

- **Nunca**: e-mail, telefone, sobrenome completo, senha, token de sessão,
  qualquer segredo. O DTO enxuto de mentor (`lib/services/assistant/tools.ts`,
  `mentorLlmDto`) existe justamente para que a busca de mentores não exponha
  campos que o modelo não precisa.
- **Com cuidado**: a resposta de "vida pessoal" do diagnóstico pode conter
  dados sensíveis (LGPD art. 5º, II — indício de saúde). O fluxo não pergunta
  detalhes de saúde diretamente; se a resposta indicar sofrimento ou crise, o
  grafo do diagnóstico deve interromper e mostrar o CVV (188, cvv.org.br) em
  vez de seguir. Essa resposta fica fora de jobs em lote e de qualquer trace
  de depuração (`AI_PLATFORM_PLAN.md` §12.2).
- **System prompt do copiloto**: só um cartão de perfil compacto (papel,
  momento de carreira, áreas, resumo do diagnóstico em ≤ 400 tokens) —
  nunca e-mail/telefone/sobrenome (plano §4.4).

## 4. Medição e auditoria

Toda chamada de modelo é medida por um callback anexado no registro
(`lib/ai/metering/callback.ts`) e gravada via RPC `security definer`
(`record_ai_usage`, [ADR 0003](adr/0003-quota-and-metering-via-security-definer-rpc.md)).
Nenhuma chamada de IA acontece sem deixar uma linha em `ai_usage_events`
(sucesso, erro ou fallback) — "sem registro, sem chamada" é o princípio 2
do plano. `service_role` nunca é usado para essas tabelas.

## 5. Retenção

Ver `AI_PLATFORM_PLAN.md` §12.1 para a tabela completa por tipo de dado
(conversas, estado do diagnóstico, resultado do diagnóstico, quiz anônimo,
eventos de uso, feedback, compartilhamentos, traces). Aplicado por um cron
diário (`/api/cron/ai-retention`, ainda não implementado — pendência da
Fase 2 do plano).

## 6. Quem acessa o quê

- **Usuário:** só os próprios dados (conversas, diagnóstico, uso/custo).
- **Mentor:** o diagnóstico de um mentorado só se houver compartilhamento
  ativo (`diagnostic_shares`, ainda não implementado — Fase 2), nunca por
  padrão.
- **Admin de org:** agregados do próprio org (contagem "fez o diagnóstico?"
  via RPC `is_org_admin()`-gated), nunca o conteúdo individual do
  diagnóstico.
- **Admin de plataforma:** uso/custo agregado (`/dashboard/admin/ai-usage`)
  e configuração de modelos/preços/entitlements. Não lê o conteúdo de
  conversas ou diagnósticos sem uma ferramenta de suporte dedicada (ainda
  não existe).

## 7. Revisão

Esta página e a tabela de preços (`AI_PLATFORM_PLAN.md` §11.1) devem ser
revisadas a cada trimestre, ou sempre que um provedor mudar preço/termos de
uso. Toda mudança de modelo, limite ou retenção é uma mudança de política e
deve atualizar esta página no mesmo PR.
