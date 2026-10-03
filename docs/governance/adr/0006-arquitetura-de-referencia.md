---
title: "ADR 0006 - Arquitetura de referência em 12 camadas por domínio"
owner: paul
status: proposed
last_reviewed: 2026-10-03
source_of_truth: [.claude/skills/menvo-blueprint/SKILL.md, .claude/skills/menvo-blueprint/references/]
---

# ADR 0006 - Arquitetura de referência em 12 camadas por domínio

- **Status:** proposto (2026-10-03). Vira "current" quando o piloto (quiz)
  estiver completo.
- **Execução:** skill `menvo-blueprint` (modos audit, plan, apply, verify).

## 1. Contexto

O MENVO cresceu feature a feature e cada domínio organiza dados de um jeito:

- Há rotas que consultam o banco direto e rotas que chamam um service.
- `lib/services/quiz/quiz.service.ts` é, na prática, um wrapper de `fetch`
  do lado do cliente; o nome sugere uma camada que ele não é.
- As chaves do TanStack Query são strings soltas em 8 arquivos e cada
  mutation decide sozinha o que invalidar.
- `docs/api-reference.md` é escrito à mão e já diverge das rotas.
- Testes existem (Jest, `route.test.ts`), mas sem um critério de que tipo
  de teste cobre qual camada; não há teste de RLS.

Além de produto, este repositório é material de estudo do Paul para
praticar boas práticas e tradeoffs do mundo real. A arquitetura precisa ser
explicável, não só funcionar.

## 2. Decisão

Todo domínio segue as mesmas 12 camadas, cada uma com uma regra única:

| # | Camada | Regra |
|---|---|---|
| 1 | Migration SQL | Fonte da verdade do schema, inclusive RLS |
| 2 | Tipos gerados | `npm run db:types`, nunca editados |
| 3 | Entity | Tipo do negócio derivado da Row |
| 4 | Zod | Contrato de entrada/saída da API |
| 5 | Repository | Único ponto que fala com o banco |
| 6 | Ports | Interface para serviços externos (e-mail, storage, IA, fila) |
| 7 | Service | Regra de negócio + autorização, sem HTTP |
| 8 | Route handler | Fino: auth → Zod → service → status |
| 9 | OpenAPI | Gerado dos schemas Zod |
| 10 | Query layer | Fábrica de chaves + mapa de efeitos + hooks |
| 11 | Página/componentes | Server chama service; client usa hooks |
| 12 | Testes | Um tipo de teste por camada |

Detalhes, templates e o "não faça" de cada camada:
`.claude/skills/menvo-blueprint/references/`.

Piloto: domínio **quiz**, porque contém os dois casos que motivaram a
camada 10 (enviar o quiz atualiza o dashboard; rascunho do quiz persistido).

## 3. Alternativas consideradas

**Prisma ou Drizzle como fonte da verdade do schema.** Rejeitado.
O projeto tem 160 migrations SQL, RLS em 29 delas, triggers, Vault e
`pg_net`. Um ORM conectado direto ao Postgres usa um papel que ignora RLS e
não modela `auth.users`; teríamos duas fontes da verdade. A portabilidade
desejada ("não ficar preso ao Supabase") é atendida de outro jeito: o SQL é
Postgres padrão (roda em Neon, RDS, local) e o acesso a dados fica isolado
no repository (camada 5).

**Portabilidade para qualquer banco (MySQL etc.).** Rejeitado. Custaria
abrir mão de RLS e de funções Postgres sem uma necessidade real. A meta é
"qualquer Postgres".

**GraphQL ou tRPC.** Rejeitado por ora. Há um único cliente (o app web);
REST + Zod + TanStack Query já dão tipos ponta a ponta, cache e
deduplicação. Reavaliar se surgir um app mobile com necessidades de dados
muito diferentes.

**Swagger via JSDoc (`next-swagger-doc`).** Rejeitado. É YAML em
comentário, sem validação; diverge como o `api-reference.md` atual.
Escolhido `zod-to-openapi`, que reaproveita os schemas da camada 4.

**Repository genérico (`BaseRepository<T>`).** Rejeitado. Cada domínio tem
consultas próprias; o genérico vira um ORM ruim.

## 4. Consequências

**Boas**
- Qualquer pessoa (ou agente) sabe onde cada coisa mora e o que não pode
  fazer ali.
- O service é testado com fakes em memória, sem banco nem rede.
- Trocar provedor de e-mail/storage/IA ou de Postgres mexe em um arquivo.
- A documentação da API não diverge: divergência quebra o teste de drift.
- "O que atualiza quando X muda" está escrito em `lib/query/effects.ts`.

**Custos**
- Mais arquivos por domínio (~10). Para uma rota trivial, parece
  cerimônia. Aceito em troca de consistência; rotas de infraestrutura
  (`health`, `cron`) podem pular camadas 3, 6 e 10 se justificado no código.
- Migração gradual: durante um tempo, domínios novos e antigos convivem.
  O teste de drift do OpenAPI mantém uma lista explícita de domínios pendentes.
- Duas novas dependências previstas: `@asteasolutions/zod-to-openapi@^7`
  e, depois, `@playwright/test`.
- Testes de RLS (pgTAP) exigem Docker e rodam local antes de PRs que mexem
  em RLS, não no CI por enquanto.

## 5. Comentários no código

Por ser material de estudo, todo arquivo de camada começa com um cabeçalho
curto: camada, regra, o que não faz e o tradeoff. Comentários inline
explicam decisões não óbvias e citam migration/ADR. Formato em
`.claude/skills/menvo-blueprint/SKILL.md`.
