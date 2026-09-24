---
title: "ADR 0001 — LangGraph/LangChain como orquestrador de agentes de IA"
owner: paul
status: current
last_reviewed: 2026-09-24
source_of_truth: [lib/services/assistant/agent.ts, lib/ai/models/factory.ts, package.json]
---

# ADR 0001 — LangGraph/LangChain como orquestrador

- **Status:** implementado. O assistente (`converse`) já roda sobre
  `createAgent` (pacote `langchain`) com `modelFallbackMiddleware`
  (ver [ADR 0004](0004-model-registry-by-capability.md) §7.1).
- **Plano:** `AI_PLATFORM_PLAN.md` §1, §2.2.

## Contexto

A Menvo precisa de um copiloto com tools (busca de mentores, disponibilidade,
feedback) e, na Fase 1, de um diagnóstico modelado como máquina de estados
(§3). As opções eram: (a) escrever o loop de chamada de modelo + tools à mão;
(b) usar o SDK de um único provedor (OpenAI Assistants, Google); (c) usar
LangChain.js/LangGraph, que já abstrai chat models multi-provedor, tool
calling, streaming e grafos de estado.

## Decisão

Adotar **LangChain.js + LangGraph** (`@langchain/core`, `@langchain/langgraph`,
`langchain`) como o orquestrador de agentes:

1. **Multi-provedor por padrão.** `lib/ai/models` (ADR 0004) troca de
   provedor (Google/Groq/OpenAI) só mudando o `ModelSpec`, porque toda
   classe implementa `BaseChatModel`. Um SDK de um único provedor amarraria
   a Menvo a ele.
2. **`createAgent` (não `createReactAgent`, que é `@deprecated`)** para o
   subgrafo `assistant` com tools — ver ADR 0004 §1 item 2 sobre por que o
   prebuilt não aceita `withFallbacks`.
3. **`StateGraph` próprio** (não o `createReactAgent`/`createAgent`
   genérico) para o subgrafo `diagnostic` da Fase 1: é uma máquina de
   estados com slots que o código já conhece (§2.2 do plano) — um agente
   ReAct gastaria tokens decidindo "qual a próxima pergunta". Ainda não
   implementado; registrado aqui porque a escolha do orquestrador é a
   mesma.
4. Reavaliar apenas se o LangChain quebrar compatibilidade de forma
   recorrente ou se surgir uma necessidade que o pacote não cubra (motivo
   para um novo ADR, não para reverter este).

## Consequências

- Toda dependência de LLM (`@langchain/google-genai`, `@langchain/groq`,
  `@langchain/openai`) é isolada em `lib/ai/models/factory.ts`; nenhum outro
  módulo instancia um chat model diretamente (ver o teste de fronteiras,
  `lib/ai/models/boundaries.test.ts`).
- Fixar versões exatas de cada pacote LangChain no `package.json` (não
  `^`), porque comportamento interno (como o de `withFallbacks` documentado
  na ADR 0004) já mudou entre versões menores.
- Verificar comportamento no `node_modules` instalado antes de assumir uma
  API, nunca de memória — LangChain.js muda rápido (prática seguida na
  ADR 0004).
