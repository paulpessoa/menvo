# Camada 14 · Superfície para agentes (capabilities, MCP, function calling)

Pergunta que esta camada responde: **o que um agente pode fazer no MENVO, em
nome de quem, e onde isso é decidido?**

## O problema hoje

As mesmas ações estão registradas duas vezes, de jeitos diferentes:

- `app/api/mcp/[transport]/route.ts`: MCP público, 3 tools, com `@ts-ignore`
  e `input: any`.
- `lib/services/assistant/agent.ts`: assistente LangChain, ~9 tools, com a
  permissão por papel feita por `if (role === ...)`.

Para saber "o que está liberado para agentes", é preciso ler os dois arquivos
inteiros. Adicionar uma tool em um e esquecer no outro é fácil, e não há teste
que pegue isso.

## A decisão: um registro de capabilities e um arquivo de exposição

```
lib/agents/
  define.ts                    # defineCapability() e os tipos
  capabilities/<domínio>.ts    # as capabilities de cada domínio
  registry.ts                  # junta todas
  exposure.ts                  # ← O LUGAR ONDE SE DECIDE O QUE É LIBERADO
  adapters/mcp.ts              # registra no servidor MCP
  adapters/langchain.ts        # vira tool() do LangChain (assistente)
  adapters/json-schema.ts      # vira function calling genérico (OpenAI/Anthropic/Gemini)
  exposure.test.ts             # snapshot do que cada superfície expõe
```

### Uma capability

```ts
/**
 * Camada 14 · Capability (appointments)
 * Regra: descreve UMA ação para agentes e delega ao service (camada 7).
 * Não faz: regra de negócio nem acesso ao banco; isso já existe no service.
 */
export const evaluateSession = defineCapability({
  name: "appointments.evaluate",          // estável e com namespace; nunca renomeie
  title: "Avaliar mentoria",
  description: "Registra a nota (1 a 5) do mentorado para uma mentoria já realizada.",
  input: evaluateSessionInput,            // Zod da camada 4
  output: evaluateSessionResult,          // Zod: remove o que o modelo não precisa ver
  audience: ["mentee", "admin"],          // quem pode usar (anonymous | authenticated | papéis)
  effect: "write",                        // read | write | destructive
  confirmation: "user",                   // write pede confirmação humana no chat
  aiFeature: "assistant",                 // cota e custo (lib/ai/features.ts)
  rateLimit: { max: 10, windowMs: 60_000 },
  handler: (input, ctx) => ctx.services.appointments.evaluate(input, ctx.actor),
})
```

### O arquivo de exposição

```ts
/**
 * Camada 14 · Exposição para agentes
 * Regra: negar por padrão. Uma capability só chega a uma superfície se
 * estiver listada aqui. Mudar este arquivo é uma decisão de produto e de
 * segurança: o PR precisa dizer por quê.
 */
export const exposure = {
  // MCP público: qualquer cliente MCP na internet, sem login.
  mcp: {
    audience: "anonymous",
    maxEffect: "read",
    allow: ["mentors.search", "mentors.availability", "platform.explain"],
  },
  // Assistente dentro do app: usuário logado, filtrado por papel (audience).
  assistant: {
    audience: "authenticated",
    maxEffect: "write",
    allow: ["mentors.*", "platform.*", "kb.search", "appointments.*", "feedback.save"],
  },
  // Function calling de servidor (jobs, admin copilot).
  server: {
    audience: "admin",
    maxEffect: "write",
    allow: ["admin.mentorReview.*"],
  },
} as const satisfies Record<Surface, SurfacePolicy>
```

Uma capability só aparece numa superfície se passar nos **três** filtros:
está no `allow` da superfície, o `effect` não passa do `maxEffect`, e o papel
do usuário está na `audience` dela.

## Regras de segurança (inegociáveis)

1. **Negar por padrão.** Esquecer de listar = não exposto.
2. **O `ctx` só tem o client com RLS do usuário** (ou anônimo no MCP). Nada de
   `service_role` dentro de handler de capability. Hoje
   `evaluateMentorshipSession` troca para `service_role` em silêncio quando a
   chave existe (`lib/services/assistant/tools.ts`): corrigir isso é o
   primeiro item da migração.
3. **MCP público é só leitura**, com rate limit por IP (já existe).
4. **Escrita pede confirmação humana** (`confirmation: "user"`): o agente
   propõe, a UI mostra um botão, o usuário confirma.
5. **A saída passa pelo schema de output.** O modelo não vê e-mail, telefone
   ou id interno de terceiros (o padrão `mentorLlmDto` já faz isso).
6. **Saída de tool é dado, não instrução.** Texto vindo do banco (bio de
   mentor, feedback) pode conter tentativa de prompt injection; o system
   prompt do assistente deve dizer isso explicitamente.
7. **Toda escrita feita por agente gera log de auditoria** com `actor`,
   `surface` e `capability`.

## Testes da camada

- `exposure.test.ts`: snapshot da lista de capabilities por superfície e por
  papel. Liberar algo novo aparece como diff no snapshot, e o PR vira a
  revisão de segurança.
- Invariantes: nenhuma capability do MCP tem `effect !== "read"`; toda
  `write` tem `confirmation: "user"`; todo `name` é único.
- Cada adapter: um teste que registra uma capability falsa e confere nome,
  schema e handler.

## Agentes de navegador também são usuários (ponte com o frontend)

Agentes que operam o navegador (computer use, Playwright MCP) leem a **árvore
de acessibilidade**, não o CSS. Por isso:
- HTML semântico, `label` em todo input, botão com nome acessível.
- Se o Playwright acha o elemento por `getByRole`, um agente também acha.
- `public/llms.txt` (gerado por `npm run build:kb`) explica o MENVO para LLMs;
  o smoke test garante que ele existe.

Acessibilidade boa = humanos com deficiência + SEO + testes estáveis + agentes.
É o mesmo trabalho.

## Para quem desenvolve: agentes no fluxo de trabalho

| Peça | Onde | Para quê |
|---|---|---|
| Regras para agentes | `docs/blueprint/agent-rules.md` (versionado); `AGENTS.md` local (ignorado pelo git) | O que todo agente deve e não deve fazer neste repo |
| Skills | `.claude/skills/` (+ ponteiro em `.agent/skills/`) | Procedimentos repetíveis, como este blueprint |
| MCP de dev | `.mcp.json` | Supabase (só leitura), Clarity, Vercel |
| CI | `.github/workflows/` | A barreira que vale para humanos e agentes igualmente |
