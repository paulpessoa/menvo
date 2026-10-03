---
name: menvo-blueprint
description: Arquitetura de referência do MENVO. Audita, planeja e aplica, camada por camada, o padrão de 14 camadas (migration SQL → tipos gerados → entity → Zod → repository → ports → service → route handler → OpenAPI → query layer → página/componentes → testes → tooling/CI → superfície para agentes) em um domínio (quiz, appointments, mentors…). Use quando o pedido for "aplicar o blueprint", "modo audit/plan/apply/verify", "deixar o domínio X no padrão", "criar feature nova no padrão", ou quando for criar/refatorar repository, service, route handler, query keys, OpenAPI/Swagger, testes (Jest, Playwright, pgTAP), CI, ou expor algo para agentes (MCP, function calling, assistente). Não use para ajuste visual puro nem para conteúdo/e-mail.
---

# MENVO Blueprint

Este repositório é também um projeto de **aprendizado**: cada camada existe
por um motivo, e o código precisa ensinar esse motivo. Seu trabalho não é só
mover código para as pastas certas, é deixar cada decisão e cada tradeoff
visível para quem ler depois.

As regras gerais para agentes estão em `docs/blueprint/agent-rules.md`.
A decisão por trás deste padrão está em
`docs/governance/adr/0006-arquitetura-de-referencia.md`. Leia antes do
primeiro uso.

## Modos

O pedido sempre chega como `modo <nome> <domínio> [camadas]`. Se o modo não
for dito, comece por `audit`.

| Modo | Escreve código? | Saída |
|---|---|---|
| `audit <domínio>` | Não | `docs/blueprint/<domínio>-audit.md`: tabela camada × estado (ok / parcial / falta) com o arquivo que prova cada estado |
| `plan <domínio>` | Não | Mesmo arquivo, seção "Plano": grupos de camadas em ordem, um commit por grupo, riscos |
| `apply <domínio> <camadas>` | Sim | Só as camadas pedidas (ex.: `1-5`). Para no fim e mostra o diff resumido |
| `verify <domínio>` | Não | Roda as checagens da seção "Verificação" e lista o que falhou |
| `apply tooling` | Sim | Camada 13 do repositório: CI, ESLint, Playwright, OpenAPI base. Ponto de parada antes de instalar dependência |
| `apply agents` | Sim | Camada 14 do repositório: `lib/agents` (registro, exposição, adapters) e migração das tools existentes |

Grupos padrão para o `apply` (cada um é um commit):

1. **Dados:** camadas 1–4 (migration, tipos, entity, Zod)
2. **Servidor:** camadas 5–8 (repository, ports, service, route handler)
3. **Contrato:** camada 9 (OpenAPI)
4. **Cliente:** camadas 10–11 (query layer, página/componentes)
5. **Agentes:** camada 14 (capabilities do domínio + exposição)
6. **Testes:** camada 12 acompanha cada grupo acima; nunca fica para o fim

A camada 13 (tooling/CI) é do repositório, não de um domínio: só muda com
`modo apply tooling`.

## As 14 camadas

Resumo. As regras completas, os templates e o "não faça" de cada camada estão
em `references/layers.md`.

| # | Camada | Onde | Regra de ouro |
|---|---|---|---|
| 1 | Migration SQL | `supabase/migrations/` | Única fonte da verdade do schema, inclusive RLS |
| 2 | Tipos gerados | `lib/types/supabase.ts` | `npm run db:types`. Nunca editar à mão |
| 3 | Entity | `lib/domain/<d>/<d>.entity.ts` | Tipo do negócio derivado da Row. A UI usa a Entity |
| 4 | Zod | `lib/schemas/<d>.ts` | Entrada e saída da API. DTO = `z.infer`, nunca tipo duplicado |
| 5 | Repository | `lib/repositories/<d>.repository.ts` | Único lugar que chama `supabase.from()`. Interface + implementação |
| 6 | Ports | `lib/ports/<serviço>.ts` | Interface para e-mail, storage, IA, fila. Adapter por provedor |
| 7 | Service | `lib/services/<d>/<d>.service.ts` | Regra de negócio + permissão. Recebe repository/ports por parâmetro |
| 8 | Route handler | `app/api/<d>/**/route.ts` | Fino: auth → Zod → service → erro vira status HTTP |
| 9 | OpenAPI | `lib/openapi/paths/<d>.ts` | Gerado dos schemas Zod da camada 4. Ver `references/openapi.md` |
| 10 | Query layer | `lib/query/keys.ts`, `lib/query/effects.ts`, `hooks/<d>/` | Toda chave nasce na fábrica; todo efeito colateral está no mapa. Ver `references/query-layer.md` |
| 11 | Página e componentes | `app/[locale]/<rota>/`, `components/<d>/` | Server Component chama o service direto; client usa hooks |
| 12 | Testes | ao lado do arquivo testado, `e2e/`, `supabase/tests/` | Um tipo de teste por camada. Ver `references/testing.md` |
| 13 | Tooling e CI | `.github/workflows/`, `eslint.config.mjs`, `playwright.config.ts` | O que roda, quando, e o que bloqueia merge. Ver `references/tooling-ci.md` |
| 14 | Superfície para agentes | `lib/agents/` | Uma capability por ação; `exposure.ts` decide o que cada superfície (MCP, assistente, servidor) libera. Negar por padrão. Ver `references/agent-surface.md` |

## Fluxo de trabalho

1. **Sincronize antes.** `git fetch origin main` e `git merge origin/main`
   na branch atual (regra do `CONTRIBUTING.md`).
2. **Leia o estado real.** No `audit`, abra os arquivos do domínio em
   `app/api/<d>`, `lib/services/<d>`, `lib/schemas`, `hooks`, `components/<d>`
   e as migrations que citam a tabela (`grep -l <tabela> supabase/migrations`).
   Não presuma que um arquivo faz o que o nome diz: confira o conteúdo.
3. **Uma camada de cada vez, na ordem.** Camada N só depende de camadas < N.
   Se precisar mudar uma camada anterior, volte e mude lá.
4. **Não quebre quem já usa.** Ao mover código, atualize todos os imports
   (`grep -rn`) no mesmo commit. Não deixe re-export "temporário".
5. **Pare nos pontos de parada** (abaixo) e mostre o que fez.

## Pontos de parada (pergunte ao Paul antes)

- Qualquer migration nova: escreva o arquivo, **não** rode `supabase db push`.
  Diga o comando e espere ele rodar e colar o resultado.
- Instalar dependência nova (`@asteasolutions/zod-to-openapi`, Playwright…).
- Mudar o formato de resposta de uma rota que o app já consome.
- Qualquer uso de `service_role` (ver ADR 0005: só como exceção documentada).
- Apagar arquivo que não foi você que criou nesta sessão.
- Liberar uma capability nova em `lib/agents/exposure.ts`, principalmente no
  MCP público ou com `effect` de escrita.
- Mudar workflow do GitHub ou regra do ESLint (afeta todo PR).

## Comentários: este código ensina

O padrão geral do repositório é comentar o **porquê**, não o quê. Neste
projeto vamos um passo além, porque ele é material de estudo:

1. **Cabeçalho em todo arquivo de camada**, 3 a 6 linhas, neste formato:

   ```ts
   /**
    * Camada 5 · Repository (quiz)
    * Regra: único ponto que fala com o banco para quiz_responses.
    * Não faz: validação de entrada (camada 4) nem regra de negócio (camada 7).
    * Tradeoff: uma interface a mais em troca de testar o service sem banco
    * e de trocar o Supabase por outro Postgres mexendo só aqui.
    */
   ```

2. **Comentário inline** só quando houver uma decisão não óbvia: uma
   alternativa descartada, uma restrição de RLS, um bug que motivou o código.
   Cite a migration ou o ADR quando existir.
3. **Idioma:** siga o idioma que o arquivo já usa (o código do repo está em
   inglês). Cabeçalhos de camada novos podem ser em português.
4. Não comente o óbvio (`// incrementa o contador`). Comentário que repete o
   código ensina a ignorar comentários.

## Verificação

Rode ao fim de cada grupo, nesta ordem, e só siga se tudo passar:

```bash
npm run db:types        # se o grupo mexeu em migration (precisa do .env.local)
npm run verify          # typecheck + lint + jest (o mesmo que o CI roda)
npx jest lib/openapi    # teste de drift do contrato, a partir do grupo 3
npx jest lib/agents     # snapshot de exposição, a partir do grupo 5
npm run build && npm run test:e2e   # se mexeu em página ou fluxo
supabase test db        # se mexeu em RLS (precisa de Docker)
```

Se a migration ainda não foi aplicada no banco, o `db:types` não vai mostrar
a coluna nova: espere o Paul aplicar, não edite o arquivo gerado.

## Saída de cada execução

Termine sempre com:

- O que mudou, por camada (arquivo → uma linha).
- Os tradeoffs que você escolheu e a alternativa que descartou.
- O resultado da verificação.
- O próximo passo sugerido (ex.: `modo apply quiz 5-8`).

## Exemplo canônico

Enquanto nenhum domínio estiver 100% no padrão, use os templates de
`references/layers.md`. Quando o piloto (quiz) estiver pronto, registre aqui
os arquivos dele como exemplo canônico.
