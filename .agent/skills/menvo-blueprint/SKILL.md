---
name: menvo-blueprint
description: Arquitetura de referência do MENVO (14 camadas por domínio, modos audit/plan/apply/verify). Use para "aplicar o blueprint", "deixar o domínio X no padrão", criar ou refatorar repository, service, route handler, query keys, OpenAPI/Swagger, testes, CI, ou expor algo para agentes (MCP, function calling).
---

# MENVO Blueprint (ponteiro)

A fonte única desta skill é `.claude/skills/menvo-blueprint/`. Este arquivo
existe só para o Antigravity encontrá-la; não duplique o conteúdo aqui.

Antes de qualquer ação, leia nesta ordem:

1. `.claude/skills/menvo-blueprint/SKILL.md`
2. `docs/governance/adr/0006-arquitetura-de-referencia.md`
3. O arquivo de `.claude/skills/menvo-blueprint/references/` da camada em que
   for trabalhar (`layers.md`, `query-layer.md`, `openapi.md`, `testing.md`,
   `tooling-ci.md`, `agent-surface.md`).

Siga as instruções de lá como se estivessem aqui.
