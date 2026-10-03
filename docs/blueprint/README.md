# Blueprint: roteiro de execução local

Guia para continuar o trabalho do ADR 0006 na sua máquina, em qualquer IDE.
A skill `menvo-blueprint` faz o trabalho; aqui está a ordem e o que pedir.

## 0. Preparar (uma vez)

```bash
git checkout claude/clever-cori-45yav2 && git pull
npm ci                                  # instala exatamente o lockfile
npx playwright install chromium         # navegador do Playwright
npm run verify                          # deve passar (~970 avisos de lint são esperados)
npm run build && npm run test:e2e       # 8 testes de smoke devem passar
```

> Se o Jest falhar em `lib/services/assistant/tools.test.ts` por timeout, é o
> item 1 da fila abaixo: com a `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`, a
> tool troca para `service_role` e tenta ir ao banco real. Para seguir, rode
> `SUPABASE_SERVICE_ROLE_KEY= npx jest` ou faça o item 1 primeiro.

No GitHub (uma vez): marque os checks **Typecheck · Lint · Unit tests**,
**Build · E2E smoke** e **No AI attribution** como obrigatórios na `main`.
Detalhes em `.claude/skills/menvo-blueprint/references/tooling-ci.md`.

## 1. Fila de trabalho, em ordem

Cada item é um pedido para o agente. Revise e faça commit entre um e outro.

| # | Peça ao agente | Por que nesta ordem |
|---|---|---|
| 1 | "use a skill menvo-blueprint, modo apply agents: crie `lib/agents` (define, registry, exposure, adapters MCP e LangChain) e migre as tools atuais do MCP e do assistente, sem mudar comportamento. Remova o fallback para service_role de `evaluateMentorshipSession`." | Fecha o risco de segurança e cria "o lugar que decide o que agentes usam" |
| 2 | "modo audit quiz" | Mapeia o piloto sem mexer em código |
| 3 | "modo apply quiz 1-4" | Dados: migration (se precisar), entity, Zod |
| 4 | "modo apply quiz 5-8" | Servidor: repository, ports, service, rota fina |
| 5 | "modo apply tooling: instale zod-to-openapi@7 e crie a camada 9 para o quiz, com a página de Swagger no admin" | Contrato |
| 6 | "modo apply quiz 10-11" | `lib/query/keys.ts`, `effects.ts` (quiz → dashboard), rascunho persistido |
| 7 | "modo apply quiz 14" e "escreva e2e/quiz.spec.ts (caminho feliz)" | Quiz vira capability e ganha E2E |
| 8 | "modo verify quiz", depois atualize o "Exemplo canônico" no SKILL.md | O quiz passa a ser o modelo dos próximos domínios |

## 2. Sugestões fora do blueprint (backlog)

Achados desta revisão que não cabem num domínio específico.

| Prioridade | Achado | Sugestão |
|---|---|---|
| Alta | `package.json` tem 46 dependências como `"latest"` | Fixar versões (`npm pkg set` ou trocar por `^x.y.z` da versão instalada). Hoje cada `npm install` pode trazer uma versão maior diferente, o que já quebrou o lint (ESLint 10) |
| Alta | Tools de agente com `service_role` silencioso | Item 1 da fila |
| Média | URL inexistente responde 200 (soft 404) | Fazer o `[...rest]` chamar `notFound()` para responder 404. Afeta SEO |
| Média | Rate limit em memória (`lib/rate-limit.ts`) | Em serverless cada instância tem o seu contador. Mover para Upstash/Vercel KV ou para o Postgres quando o abuso aparecer |
| Média | `@supabase/auth-helpers-react` (descontinuado) junto com `@supabase/ssr` | Remover o auth-helpers e ficar só com `@supabase/ssr` |
| Média | `axios` e `fetch` convivendo | Padronizar em `fetch` (Next estende o `fetch` com cache) |
| Baixa | Arquivos soltos na raiz: `schema_dump.sql`, `test-org.ts`, `mentor-agenda-reminder-preview.html` | Mover para `scripts/` ou `docs/archive/`, ou apagar se não forem usados |
| Baixa | `next.config.mjs` com `eslint.ignoreDuringBuilds` | Ok agora que o CI roda o lint separado; manter |
| Baixa | Dois templates de PR (`PULL_REQUEST_TEMPLATE.md` e `pull_request_template.md`) | Manter um só |
