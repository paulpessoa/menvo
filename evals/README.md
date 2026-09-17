# Evals

Testes que fazem chamadas reais a provedores de LLM contra um conjunto fixo
de casos — diferente de `npm test` (que mocka `fetch` e testa lógica
determinística). Nunca rodam no CI nem no `npm test`; são a única forma de
saber se uma mudança de prompt/modelo melhorou ou piorou o resultado.

## `npm run eval:match`

Roda os 20 casos de `ai-match.cases.mjs` contra `aiMatchService` de verdade
(`lib/services/ai/groq.service.ts`), usando `OPENAI_API_KEY`/`GROQ_API_KEY`
do `.env.local`. Mentores em `ai-match.fixtures.mjs` são sintéticos —
cobrem as categorias que o prompt prioriza (Carreira, Tecnologia,
Programação, Produto, Design, Dados, Gestão, Educação) mais Marketing e
Financeiro, e servem também pra testar `no_match` honesto (astronauta,
médico, jogador de futebol — nada na lista deveria "forçar" um match).

Rode antes/depois de qualquer mudança em `groq.service.ts` (prompt, modelo,
temperatura, ordem de fallback) e compare a taxa de acerto e a latência
média. Baseline registrado em 2026-09-17: **20/20 (100%), ~2.5s médio**,
contra `gpt-4o-mini`.

Custo: 20 chamadas reais por execução — não rode em loop.
