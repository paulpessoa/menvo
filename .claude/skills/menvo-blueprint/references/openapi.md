# Camada 9 · OpenAPI / Swagger

## Decisão

Gerar o OpenAPI **a partir dos schemas Zod da camada 4**, com
`@asteasolutions/zod-to-openapi`. A documentação passa a ser derivada do mesmo
código que valida a request; não há um segundo lugar para manter.

| Opção | Por que não (ou sim) |
|---|---|
| `docs/api-reference.md` escrito à mão (hoje) | Já diverge do código. Vira só um índice que aponta para o Swagger |
| `next-swagger-doc` (JSDoc `@swagger` em cima da rota) | YAML em comentário: ninguém valida, diverge igual |
| **`zod-to-openapi`** | Usa os schemas que já existem. Divergência vira erro de teste |
| tRPC / GraphQL | Resolveria tipos ponta a ponta, mas troca a arquitetura toda. Não vale para um app com um único cliente web |

**Versão:** o repo usa `zod@^3`. Use `@asteasolutions/zod-to-openapi@^7`
(a v8 exige zod 4). Instalar é ponto de parada: peça ao Paul.

## Estrutura

```
lib/openapi/
  registry.ts          # cria o OpenAPIRegistry e chama extendZodWithOpenApi(z) uma vez
  paths/quiz.ts        # registerPath de cada rota do domínio quiz
  document.ts          # monta o documento (OpenApiGeneratorV31) importando todos os paths
  document.test.ts     # teste de drift (abaixo)
app/api/openapi/route.ts                    # GET → JSON do documento
app/[locale]/dashboard/admin/api-docs/page.tsx  # Swagger UI
```

Por que os paths ficam em `lib/openapi/paths` e não no `route.ts`: o Next só
aceita exportar handlers HTTP e config de um `route.ts`; qualquer outro
export quebra o build.

## Template de path

```ts
/**
 * Camada 9 · Contrato OpenAPI (quiz)
 * Regra: descreve as rotas com os MESMOS schemas que a rota usa para validar.
 */
registry.registerPath({
  method: "post",
  path: "/api/quiz",
  tags: ["quiz"],
  summary: "Envia um quiz e agenda a análise por IA",
  request: { body: { content: { "application/json": { schema: quizSubmitSchema } } } },
  responses: {
    201: { description: "Criado", content: { "application/json": { schema: quizSubmitResponseSchema } } },
    400: { description: "Dados inválidos", content: { "application/json": { schema: apiErrorSchema } } },
    429: { description: "Rate limit", content: { "application/json": { schema: apiErrorSchema } } },
  },
})
```

## Quem pode ver

- Em desenvolvimento: aberto.
- Em produção: só admin (guard `requireAdmin` na rota `/api/openapi` e na
  página). Tradeoff: o mapa da API ajuda quem quer atacar; segurança não deve
  depender disso, mas não há motivo para publicar.

## Swagger UI

A página carrega `swagger-ui-dist` pelo CDN (cdnjs) apontando para
`/api/openapi`. Evita uma dependência pesada no bundle. Alternativa: Scalar,
mesmo esquema.

## Teste de drift (`lib/openapi/document.test.ts`)

1. Gera o documento e valida que é OpenAPI válido.
2. Lista as rotas do domínio (`glob app/api/<d>/**/route.ts` + métodos
   exportados) e falha se alguma não tiver `registerPath`.
3. Rotas ainda fora do padrão entram numa lista `pendingDomains` explícita,
   que encolhe conforme os domínios migram.
