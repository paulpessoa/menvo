---
title: "ADR 0004 — Registro de modelos por capacidade (lib/ai/models + ai_model_config)"
owner: paul
status: draft
last_reviewed: 2026-09-23
source_of_truth: [supabase/migrations/20260923000004_ai_model_config.sql, lib/ai/metering.ts, lib/ai/langchain-metering.ts, lib/services/assistant/agent.ts, lib/services/ai/groq.service.ts, supabase/functions/analyze-quiz/index.ts]
---

# ADR 0004 — Registro de modelos por capacidade

- **Status:** proposto (2026-09-23). Migração escrita, **não aplicada**.
- **Plano:** `AI_PLATFORM_PLAN.md` §1 princípio 3, §8 Fase 0 itens 2, 8 e 10, §11.2.
- **Para quem implementa (Sonnet):** as §3 a §7 são a especificação. As
  §8 e §9 trazem os critérios de aceite e os testes. Não aplique a migração
  sem o OK do fundador.

## 1. Contexto

Hoje cada funcionalidade escolhe o modelo no código, com três stacks
diferentes (plano §0, dívida 5):

| Onde | Modelo hoje | Fallback | Medição |
|---|---|---|---|
| `lib/services/assistant/agent.ts` | `gemini-3.5-flash-lite` (Gemini instanciado; `qwen/qwen3.8-27b` no Groq instanciado e **nunca usado**) | nenhum | `streamEvents` → `lib/ai/langchain-metering.ts` |
| `lib/services/ai/groq.service.ts` (match) | `gpt-4o-mini` via `fetch` | `openai/gpt-oss-20b` (Groq) via `fetch`, depois palavra-chave | manual (`AiCallRecord`) |
| `supabase/functions/analyze-quiz` | `gpt-3.5-turbo` via `fetch` (Deno, `service_role`) | análise fixa | **nenhuma** |

Fatos verificados nos pacotes instalados (`node_modules`, 2026-09-23):
`@langchain/core` 1.2.12, `@langchain/google-genai` 2.3.2, `@langchain/groq`
1.3.1, `@langchain/langgraph` 1.4.16, `langchain` 1.5.11. **`@langchain/openai`
não está instalado.**

1. **`withFallbacks` não funciona com `createReactAgent`.** O
   `createReactAgent` chama `_bindTools(llm)`, que só aceita `BaseChatModel`,
   `RunnableBinding` ou `RunnableSequence`. Com um `RunnableWithFallbacks`, ele
   lança `llm … must define bindTools method`
   (`@langchain/langgraph/dist/prebuilt/react_agent_executor.js`). Um
   `bindTools` antes do `withFallbacks` também não resolve, porque o resultado
   continua sendo um `RunnableWithFallbacks`. O comentário no `agent.ts` está
   certo.
2. **`createReactAgent` está `@deprecated`** e foi movido para
   `createAgent` do pacote `langchain`. O `langchain` 1.5.11 já traz
   `modelFallbackMiddleware(...models)` (`langchain/dist/agents/middleware/modelFallback.js`):
   ele envolve `wrapModelCall` e, em caso de erro, repete a chamada com
   `request.model` trocado. O `AgentNode` liga as tools a `request.model` em
   toda chamada, então **o fallback recebe as tools**.
3. **`RunnableWithFallbacks` em streaming** (`@langchain/core/dist/runnables/base.js`)
   só troca de modelo se o stream falhar **antes do primeiro chunk**. Um erro
   no meio do stream é propagado sem fallback. Não há `exceptionsToHandle`
   nesta versão: qualquer erro dispara o fallback.
4. **`streamEvents` v2 não emite `on_chat_model_error`**
   (`@langchain/core/dist/tracers/event_stream.js` só tem `on_tool_error`).
   Por isso o coletor atual (`langchain-metering.ts`) **não vê a tentativa que
   falhou**. Com fallback ligado, ela sumiria da medição, apesar de poder ser
   cobrada (timeout).
5. Por padrão, os chat models tentam de novo **6 vezes** (`AsyncCaller`,
   `maxRetries`) antes de falhar. Com fallback, isso atrasa a troca em dezenas
   de segundos. O primário precisa de `maxRetries` baixo.
6. Os nomes dos parâmetros mudam por provedor: Gemini usa `maxOutputTokens`;
   Groq e OpenAI usam `maxTokens`. O `gpt-5-mini` é um modelo de raciocínio e
   rejeita `temperature` diferente do padrão.
7. `record_ai_usage` exige `auth.uid()` (lança `authentication required`).
   Logo, **uma chamada anônima não pode ser medida hoje**, e isso importa para
   o `analyze-quiz`.

## 2. Decisão

1. Uma tabela `ai_model_config` (uma linha por capacidade: primário, `params`,
   `fallback` ordenado) semeada com a §11.2. O código tem uma **cópia
   embutida** dessa semente, usada sempre que o banco não responde.
2. Um módulo `lib/ai/models` resolve a capacidade na cadeia de modelos e
   instancia os modelos LangChain. Ele não importa nada de `lib/services/*`
   (§1 princípio 6).
3. O fallback usa **`withFallbacks`** para chamadas diretas (extract,
   followup, analyze, route, rank) e **`modelFallbackMiddleware` +
   `createAgent`** para o agente com tools (`converse`), substituindo o
   `createReactAgent` (deprecated).
4. A medição passa a ser um **callback handler por modelo** (desenho original
   da §5.2), criado pelo registro. Ele registra sucesso **e erro** de cada
   tentativa. O coletor via `streamEvents` é removido para não contar duas
   vezes.

## 3. Tabela `ai_model_config`

Arquivo: `supabase/migrations/20260923000004_ai_model_config.sql`.

- Colunas: `capability` (PK), `provider` (`google|groq|openai`), `model`,
  `params jsonb`, `fallback jsonb` (array de `{provider, model, params}`),
  `active`, `notes`, `updated_at`, `updated_by`.
- `active = false`: a linha é ignorada e vale o default do código. **Desligar
  uma funcionalidade continua sendo papel do `ai_entitlements`**; cada
  preocupação tem um mecanismo só.
- Trigger `ai_model_config_validate`: recusa modelo (primário ou fallback) sem
  linha em `ai_model_pricing`. Um modelo sem preço grava `cost_usd = null`, e
  o `ai_budget` o contaria como grátis. O trigger também recusa entrada de
  fallback malformada.
- RLS igual à de `ai_model_pricing`/`ai_entitlements`: `select` para
  `authenticated`, `all` para `is_admin()`. `anon` não tem acesso. Sem
  `service_role`.
- A semente segue a §11.2, mais `rank` (o match), com o que roda hoje em
  produção (`gpt-4o-mini` → `openai/gpt-oss-20b`), para que **aplicar a
  migração não mude comportamento nenhum no match**. `stt` fica fora da
  semente (Fase 3, cobrado por minuto de áudio).

## 4. API de `lib/ai/models`

```
lib/ai/models/
  capabilities.ts   AI_CAPABILITIES, aiCapabilitySchema, AiCapability
  schema.ts         modelParamsSchema, modelSpecSchema, modelConfigRowSchema (Zod)
  defaults.ts       DEFAULT_MODEL_CONFIG: Record<AiCapability, ModelChain> (= semente)
  resolve.ts        resolveModelChain(capability, rows) — puro, sem I/O
  load.ts           loadModelChain(supabase, capability) — lê a tabela, cache 60 s
  factory.ts        createChatModel(spec, opts) — provedor → classe LangChain
  index.ts          getModel / getStructuredModel / getAgentModels (reexporta o resto)
```

```ts
export const AI_CAPABILITIES = [
  "route", "extract", "followup", "converse", "analyze", "classify_batch", "rank"
] as const
export type AiCapability = (typeof AI_CAPABILITIES)[number]

export const modelParamsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxOutputTokens: z.number().int().positive().max(32_768).optional(),
  maxRetries: z.number().int().min(0).max(3).optional(),   // default 1 no primário, 0 nos fallbacks
  timeoutMs: z.number().int().min(1_000).max(120_000).optional()
}).strict()

export const modelSpecSchema = z.object({
  provider: z.enum(["google", "groq", "openai"]),
  model: z.string().min(1).max(100),
  params: modelParamsSchema.default({})
})
export type ModelSpec = z.infer<typeof modelSpecSchema>

export interface ModelChain {
  capability: AiCapability
  source: "db" | "default"
  primary: ModelSpec
  fallbacks: ModelSpec[]
}

/** Pure. Invalid/inactive/missing row → DEFAULT_MODEL_CONFIG[capability]. */
export function resolveModelChain(capability: AiCapability, rows: unknown[] | null): ModelChain

/** Reads ai_model_config with the caller's client (RLS applies). Never throws. */
export async function loadModelChain(
  supabase: SupabaseClient, capability: AiCapability
): Promise<ModelChain>

/** Plain model, with fallbacks. For text generation (followup). */
export async function getModel(
  supabase: SupabaseClient, capability: AiCapability, opts: ModelOptions
): Promise<Runnable<BaseLanguageModelInput, AIMessageChunk>>

/** Structured output (Zod) with fallbacks. For extract, analyze, route, rank. */
export async function getStructuredModel<T extends Record<string, unknown>>(
  supabase: SupabaseClient, capability: AiCapability, schema: z.ZodType<T>, opts: ModelOptions
): Promise<Runnable<BaseLanguageModelInput, T>>

/** For createAgent: primary instance + fallback instances for modelFallbackMiddleware. */
export async function getAgentModels(
  supabase: SupabaseClient, capability: AiCapability, opts: ModelOptions
): Promise<{ primary: BaseChatModel; fallbacks: BaseChatModel[]; chain: ModelChain }>

export interface ModelOptions {
  /** Receives one AiCallRecord per attempt (ok, error, fallback). Required: no metering, no call (§1 princ. 2). */
  onCall: (record: AiCallRecord) => void
}

export class AiModelUnavailableError extends Error {}   // chain empty after skipping providers without an API key
```

Regras de implementação:

- **Fallback direto:** `primary.withStructuredOutput(schema).withFallbacks(fallbacks.map(m => m.withStructuredOutput(schema)))`.
  Cada modelo recebe o `withStructuredOutput` **antes** do `withFallbacks`
  (o `RunnableWithFallbacks` não tem esse método).
- **Fallback do agente:** `createAgent({ model: primary, tools, systemPrompt, middleware: [modelFallbackMiddleware(...fallbacks)] })`.
  Passe as **instâncias** (com callbacks de medição), nunca strings, porque
  uma string faria o middleware chamar `initChatModel`, que não tem medição e
  exige `@langchain/openai`/chaves próprias.
- **Factory:** `google` → `ChatGoogleGenerativeAI` (`maxOutputTokens`);
  `groq` → `ChatGroq` (`maxTokens`, `timeout`); `openai` → `ChatOpenAI` de
  `@langchain/openai` (`maxTokens`). O `@langchain/openai` **ainda não está
  instalado**. `npm view` mostra a versão `1.5.13` com peer
  `@langchain/core ^1.2.11`, compatível com a 1.2.12 instalada. Fixar a versão
  exata, como foi feito com o langgraph, e conferir o peer no
  `package-lock.json` depois de instalar. `temperature` só vai para o
  construtor se estiver em `params` (a semente do `gpt-5-mini` não tem).
- **Chave ausente:** se não há `GOOGLE_GENERATIVE_AI_API_KEY`/`GROQ_API_KEY`/`OPENAI_API_KEY`
  para um provedor, essa entrada sai da cadeia (com `console.warn`). Se a
  cadeia ficar vazia, `AiModelUnavailableError`, e quem chamou faz o fallback
  determinístico (o match já faz por palavra-chave; o assistente responde erro
  amigável como hoje).
- **`maxRetries`:** `params.maxRetries ?? 1` no primário e `?? 0` nos
  fallbacks, para que a troca aconteça em segundos.

## 5. Tabela vazia, fora do ar ou com linha inválida

A cota e o orçamento já falham fechados no Postgres (`consume_ai_quota`). O
registro de modelos **falha aberto para os defaults**: se o banco caiu, a
cota já barrou a chamada antes. Quando o registro é consultado, o banco está
de pé e só a leitura da config falhou; derrubar a IA por isso seria pior.

| Situação | Resultado | Log |
|---|---|---|
| Linha válida e `active` | `source: "db"` | — |
| Tabela vazia / capacidade sem linha | default do código, `source: "default"` | nenhum (estado normal antes da migração) |
| `active = false` | default | nenhum |
| Linha reprovada no Zod (provedor desconhecido, `params` com chave extra…) | default | `console.warn` com a capacidade e o erro do Zod |
| Erro do PostgREST / timeout da leitura (> 1,5 s) | default | `console.warn`, **uma vez por janela de cache** |
| Chamador anônimo (RLS nega `select` para `anon`) | a leitura volta vazia → default | nenhum |

Cache: `Map` em memória do módulo, TTL de 60 s, com a consulta de todas as
linhas de uma vez (`select capability, provider, model, params, fallback, active`).
Aqui memória é aceitável, porque é config e não limite (diferente da cota). A
troca de modelo passa a valer em ≤ 60 s por instância. Erro de leitura fica
em cache por 10 s, para não martelar o banco durante um incidente. Exponha
`__resetModelConfigCache()` só para testes.

## 6. Medição

Hoje: `lib/ai/metering.ts` (`AiCallRecord`, `recordAiCalls` via RPC com
`AI_METERING_KEY`) e `lib/ai/langchain-metering.ts` (coletor de `streamEvents`).

Novo: `lib/ai/metering/callback.ts` →
`createMeteringCallback({ provider, model, isFallback, onCall })`, um
`BaseCallbackHandler` anexado pelo `factory.ts` a **cada** modelo que ele
cria (`callbacks` no construtor, que sobrevive a `bindTools`,
`withStructuredOutput` e `withFallbacks`).

- `handleChatModelStart` → guarda `Date.now()` por `runId`.
- `handleLLMEnd` → lê `output.generations[0][0].message.usage_metadata`
  (`input_tokens`, `output_tokens`, `input_token_details.cache_read`) e emite
  `status: isFallback ? "fallback" : "ok"`.
- `handleLLMError` → emite `status: "error"`, tokens 0, `errorCode` =
  `err.name` ou status HTTP (sem mensagem, que pode conter conteúdo).
- `provider`/`model` vêm do `ModelSpec`, e não de `ls_provider`: por isso o
  `PROVIDER_ALIASES` deixa de ser necessário.

Consequências:
- `app/api/assistant/route.ts` deixa de passar eventos para
  `createLangChainUsageCollector`. O `onCall` empurra para um array, que é
  enviado com `recordAiCalls(...)` no fim do stream, como hoje.
  **`lib/ai/langchain-metering.ts` e o teste dele são removidos** no mesmo PR
  (dois mecanismos contariam em dobro).
- Chamadas que não usam LangChain (a transport `fetch` do match, se ela ficar)
  continuam montando `AiCallRecord` na mão.
- Chamadas anônimas passam a ser medidas pela opção A da §7.3 (D8).

## 7. Aposentadorias e o que muda em cada ponto

### 7.1 `qwen/qwen3.8-27b` e o assistente (`converse`)

1. `agent.ts`: remover `ChatGroq`/`qwen` e o `ChatGoogleGenerativeAI` fixo.
   `getAssistantAgent(supabase, { onCall })` fica `async`, chama
   `getAgentModels(supabase, "converse", { onCall })` e monta
   `createAgent({ model: primary, tools, systemPrompt: SYSTEM_PROMPT, middleware: [modelFallbackMiddleware(...fallbacks)] })`
   de `langchain`.
2. `route.ts`: `await getAssistantAgent(...)`. O SSE `mentors_found` continua
   lendo `event.data.output.artifact` no `on_tool_end` de `searchMentors`.
   **Confirmar com um teste** que o `createAgent` emite o mesmo `on_tool_end`
   com `output` sendo o `ToolMessage` (o nome do evento do modelo muda de
   `agent` para `model_request`, mas a rota só filtra eventos de tool e de
   chat model).
3. Streaming com fallback: se o Gemini cair no meio da resposta, o middleware
   repete com o `gpt-oss-120b` e o usuário vê o texto parcial seguido da
   resposta nova. Aceitável na Fase 0. A rota deve mandar um evento
   `{"type":"reset"}` quando receber `on_chat_model_start` de um modelo
   fallback no mesmo turno, e isso fica registrado para o protocolo SSE tipado
   (Fase 0 item 6).
4. `npm run test:evals` precisa passar com o primário **e** com o fallback
   forçado (`AI_FORCE_FALLBACK=converse`, só em evals: o registro pula o
   primário).
5. A linha de preço do `qwen` em `ai_model_pricing` **fica** (histórico; é
   append-only).

### 7.2 Match (`groq.service.ts` → capacidade `rank`)

1. `PROVIDERS` fixo sai. `aiMatchService` recebe o `supabase` da rota e usa
   `getStructuredModel(supabase, "rank", aiMatchResultSchema, { onCall })`.
   Isso exige `@langchain/openai`, porque o primário semeado é o `gpt-4o-mini`.
2. Tudo o que é domínio fica: prompt, `sanitize` de `mentor_id` inventado,
   fallback por palavra-chave (`provider: "local", model: "keyword"`) quando
   a cadeia toda falha ou `AiModelUnavailableError`.
3. O nome do arquivo engana (é o match, não o Groq): renomear para
   `lib/services/ai/match.service.ts` no mesmo PR e atualizar os 3 imports e o
   `jest.mock` de `app/api/admin/waiting-list/match/route.test.ts`.
4. **Troca de modelo depois:** mudar `rank` para `gemini-2.5-flash-lite`
   (0,10/0,40 contra 0,15/0,60) só com `npm run eval:match` verde, via
   `UPDATE`, sem deploy.

### 7.3 `gpt-3.5-turbo` (`supabase/functions/analyze-quiz`)

A Edge Function roda em Deno e não importa `lib/ai`; usa `service_role`; é
chamada anonimamente; não é medida; e **qualquer pessoa com um `id` pode
reexecutá-la sem limite** (cada chamada é paga). Duas opções:

- **A (recomendada): mover para `POST /api/quiz/[id]/analyze` (Next.js).**
  Usa `getStructuredModel(..., "analyze", analysisSchema)` (Gemini 2.5 Flash →
  `gpt-5-mini`). O prompt e o schema vão para `lib/ai-menvo/diagnostic/analyze.ts`,
  o mesmo nó `analyze` que o diagnóstico da Fase 1 vai usar. Exige uma
  migração pequena, **a aprovar junto com a correção da RLS do quiz**:
  (a) `record_ai_usage` aceita `auth.uid()` nulo quando a `p_server_key` é
  válida (a chave já prova que a chamada vem do servidor; `user_id` fica
  nulo); (b) RPC `claim_quiz_analysis(p_server_key, p_id)` security definer
  e atômica: só retorna `true` se `processed_at is null`, se ninguém reivindicou
  nos últimos 2 min e se `ai_budget_exhausted()` for falso. Isso acaba com a
  reexecução ilimitada e põe o quiz anônimo dentro do teto de US$ 10;
  (c) RPC `save_quiz_analysis(p_server_key, p_id, p_analysis, p_score)`. A
  Edge Function fica sem uso: apagar depois de uma semana sem chamadas nos logs.
- **B (mínima):** trocar `gpt-3.5-turbo` por `gpt-4o-mini` na Edge Function,
  mantendo o `fetch` e o formato. Aposenta o modelo legado em uma linha, mas
  não usa o registro, não mede, não respeita o orçamento e mantém o
  `service_role`.

**Decidido pelo fundador em 2026-09-23 (D8): opção A.** A migração da
opção A é nova (`20260923000006_…`, escrita por quem implementa, **não
aplicada** sem OK) e deve rodar **depois** de
`20260923000005_quiz_responses_privacy.sql` (a correção da RLS do quiz,
aprovada), porque o fluxo novo do quiz depende das duas.

## 8. Critérios de aceite

1. `lib/ai/models/**` não importa `@/lib/services/*` nem `@/lib/ai-menvo/*`
   (teste abaixo + `grep` no PR).
2. Com `ai_model_config` **não aplicada** (estado atual do banco), assistente
   e match funcionam como hoje, com `source: "default"`.
3. `DEFAULT_MODEL_CONFIG` é igual à semente SQL (teste que faz o parse do
   `INSERT` da migração).
4. Nenhum modelo `qwen/*` ou `gpt-3.5-turbo` em `lib/`, `app/` ou
   `supabase/functions/` (depois de D8 = A ou B).
5. Com o primário forçado a falhar, o assistente responde pelo fallback com as
   4 tools funcionando, e `ai_usage_events` recebe **uma linha `error` + uma
   `fallback`** para aquela chamada.
6. Um turno normal do assistente grava o mesmo número de linhas que hoje
   (uma por chamada de modelo), sem duplicação.
7. `langchain-metering.ts` removido; nenhum `createReactAgent` no código.
8. `npx tsc --noEmit` = 0; `npm test` verde; `npm run test:evals` e
   `npm run eval:match` verdes; `npm run build` ok.
9. Diário do `STATUS.md` atualizado. `docs/operations/environment-variables.md`
   sem mudanças (nenhuma env nova além de `AI_FORCE_FALLBACK`, que é só de
   evals; documentar lá mesmo assim).

## 9. Testes (co-localizados, Jest)

`lib/ai/models/resolve.test.ts` (puro):
- linha válida → `source: "db"`, primário e fallbacks na ordem do `jsonb`;
- `rows = null`, `[]` e capacidade ausente → default, `source: "default"`;
- `active: false` → default;
- provedor desconhecido, `params` com chave extra (`.strict()`) ou
  `temperature: 5` → default (e o warn é chamado, com `jest.spyOn(console, "warn")`);
- fallback malformado → a linha inteira é rejeitada (não fica "meia cadeia").

`lib/ai/models/defaults.test.ts`:
- `DEFAULT_MODEL_CONFIG` cobre todas as `AI_CAPABILITIES`;
- é igual à semente de `supabase/migrations/20260923000004_ai_model_config.sql`
  (lê o arquivo e faz o parse das tuplas do `INSERT`);
- o `analyze` fallback (`gpt-5-mini`) não tem `temperature`.

`lib/ai/models/load.test.ts` (Supabase mockado):
- duas chamadas dentro de 60 s → uma consulta só (`jest.useFakeTimers`);
- depois de 60 s → consulta de novo;
- `error` do PostgREST ou promessa que não resolve em 1,5 s → default, sem throw.

`lib/ai/models/factory.test.ts`:
- `google` → `ChatGoogleGenerativeAI` com `maxOutputTokens`; `groq` →
  `ChatGroq` com `maxTokens`; `openai` → `ChatOpenAI` com `maxTokens` e sem
  `temperature` quando ausente em `params`;
- `maxRetries` 1 no primário e 0 nos fallbacks por padrão;
- provedor sem chave → pulado; cadeia vazia → `AiModelUnavailableError`.

`lib/ai/models/index.test.ts` (sem rede, com `FakeListChatModel`/`FakeChatModel`
de `@langchain/core/utils/testing`; o factory é injetável para isso):
- `getStructuredModel`: primário lança → fallback responde → retorna o valor
  parseado; `onCall` recebeu `[error, fallback]`;
- os dois falham → propaga o **primeiro** erro (comportamento do core);
- `getAgentModels` + `createAgent` + `modelFallbackMiddleware`: primário lança →
  o fallback recebe as tools (um fake que devolve um `tool_call` de
  `searchMentors` e confere que a tool executou).

`lib/ai/metering/callback.test.ts`:
- `handleLLMEnd` com `usage_metadata` → `AiCallRecord` com tokens, cache e
  latência ≥ 0;
- sem `usage_metadata` → tokens 0, status mantido;
- `handleLLMError` → `status: "error"`, `errorCode` sem a mensagem do erro;
- `isFallback: true` → `status: "fallback"` no sucesso.

`lib/ai/models/boundaries.test.ts`:
- lê todos os `.ts` de `lib/ai/` e falha se algum importar `@/lib/services/`.

`app/api/assistant/route` (atualizar o teste existente, ou criar se não houver):
- o SSE `mentors_found` continua saindo com o `artifact` depois da troca para `createAgent`.

## 10. Consequências

- Trocar modelo = `UPDATE ai_model_config …` (admin), sem deploy, valendo em
  ≤ 60 s. Toda troca continua passando por evals antes (§11.2).
- Ganha uma dependência (`@langchain/openai`) e perde duas stacks `fetch`
  (match e, com D8 = A, a Edge Function).
- A degradação para modelo barato a 80% do orçamento (Fase 0, pendente)
  encaixa aqui depois: uma coluna `economy jsonb` por capacidade, lida pelo
  `loadModelChain` quando `get_ai_quota` indicar ≥ 80%. Fora do escopo deste ADR.
