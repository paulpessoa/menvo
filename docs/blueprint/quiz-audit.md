# Audit do domínio quiz (14 camadas)

> Modo `audit`: só leitura, nenhum código mudou. Data: 2026-10-07.
> Legenda: **ok** = cumpre a regra da camada; **parcial** = existe mas foge da
> regra; **falta** = não existe. A coluna "Prova" é o arquivo que sustenta o estado.

Escopo lido: `app/api/quiz/**` (6 rotas), `lib/services/quiz/`, `lib/quiz/`,
`lib/schemas/quiz.ts`, `lib/types/models/quiz.ts`, `lib/ai-menvo/diagnostic/analyze.ts`,
`components/quiz/`, `app/[locale]/quiz/**`, 8 migrations do quiz e os testes.

## Camada × estado

| # | Camada | Estado | Prova |
|---|---|---|---|
| 1 | Migration SQL | **ok** | RLS e RPCs em `20260923000005_quiz_responses_privacy.sql`, `…000006_quiz_analyze_registry.sql` (`claim_quiz_analysis`, `save_quiz_analysis`), `20260930000000_quiz_limits_and_share_ownership.sql`, `20261001000000_quiz_rate_limiting.sql` (`quiz_submission_status`). A policy de insert foi redefinida 4 vezes; o estado final é o da última migration. |
| 2 | Tipos gerados | **ok** | `quiz_responses` em `lib/types/supabase.ts`. Exceção: `quiz-result.server.ts:23` chama `(supabase.rpc as any)("get_quiz_result")`. |
| 3 | Entity | **falta** | Não existe `lib/domain/quiz/`. `lib/types/models/quiz.ts` tem interfaces escritas à mão (`QuizResponseSummary`, `QuizResultView`, `QuizAnalysisResult`) e um alias da Row inteira (`QuizResponseRow`), sem separar o que a UI pode ver. |
| 4 | Zod | **parcial** | `quizSubmitSchema` cobre a entrada do `POST /api/quiz` (`lib/schemas/quiz.ts`). Faltam: schema de saída das rotas, schema de `ai_analysis` (as rotas fazem `as unknown as QuizAnalysisResult`), validação de `id` como UUID nos params, e o body do `account` é um schema inline na rota. `QuizSubmitInput` em `quiz.service.ts:7` é uma interface duplicada do schema (sem os limites `min/max`). |
| 5 | Repository | **falta** | `supabase.from("quiz_responses")` direto em 4 lugares: `app/api/quiz/route.ts:95`, `app/api/quiz/latest/route.ts:27`, `app/api/quiz/[id]/account/route.ts:24,113`, `lib/services/quiz/quiz-email.service.ts:18,45`. RPCs chamadas direto em `[id]/route.ts`, `[id]/analyze/route.ts`, `quiz-result.server.ts`. |
| 6 | Ports | **parcial** | IA já passa pelo registro de modelos (`analyzeQuiz` → `lib/ai/models`, ADR 0004). E-mail é função direta `sendQuizResultsEmail` de `lib/email/brevo.ts`, sem interface; o service não é testável sem Brevo. |
| 7 | Service | **falta** | `lib/services/quiz/quiz.service.ts` é um wrapper de `fetch` do cliente (o ADR 0006 §1 já aponta isso). As regras vivem nas rotas: e-mail derivado da sessão e checagem de limite em `route.ts`; orquestração claim → buscar mentores → analisar → salvar → enviar e-mail em `analyze/route.ts` (116 linhas); criação de conta em `account/route.ts`. `quiz-email.service.ts` é o único service de servidor e mistura leitura de banco, regra e envio. |
| 8 | Route handler | **parcial** | 6 rotas, todas com comentário de porquê (bom). Fogem do "fino": `analyze` e `account` fazem regra e acesso a dados. Zod só em `POST /api/quiz` e `account`. Erro → status é feito à mão em cada rota. |
| 9 | OpenAPI | **falta** | Não existe `lib/openapi/`; `docs/api-reference.md` é escrito à mão. |
| 10 | Query layer | **falta** | Não existe `lib/query/` nem `hooks/quiz/`. A página de resultado usa `quizService` dentro de `useEffect` com polling (`results/[id]/page.tsx:169`); o dashboard do mentorado chama `getLatestQuizResponseByEmail` (`dashboard/mentee/page.tsx:126`) e não é atualizado ao enviar o quiz. Rascunho do quiz não é persistido (`QuizForm.tsx` sem `localStorage`). Estes são os dois casos que motivaram a camada (ADR 0006 §2). |
| 11 | Página e componentes | **parcial** | Páginas são client components que buscam dados no `useEffect`. Tamanhos acima de ~150 linhas: `results/[id]/page.tsx` 474, `QuizForm.tsx` 325. O `quiz/page.tsx` tem 172. `results/[id]/page.tsx:22` importa `createClient` do browser e não usa. |
| 12 | Testes | **parcial** | Cobertos: `POST /api/quiz` (11 casos em `route.test.ts`), `QuizForm.test.tsx`, `result-link.test.ts`, `analyze.test.ts`. Sem teste: `GET /api/quiz/[id]`, `latest`, `analyze` (rota), `account`, `send-email`, `quiz-email.service`. Sem pgTAP para as policies, apesar de 4 migrations de RLS. E2E: `e2e/smoke.spec.ts` só abre o primeiro passo. |
| 13 | Tooling e CI | **n/a** | É do repositório, não do domínio (`modo apply tooling`). |
| 14 | Superfície para agentes | **falta (decidir)** | O quiz não tem capability. O assistente lê o diagnóstico por `diagnostic.service` fora de `lib/agents`. Decisão pendente: expor "resultado do meu diagnóstico" como leitura ou manter fora. |

## Achados que não são "falta de camada"

1. **`service_role` sem ADR em 2 pontos.** `account/route.ts` (lê a row e usa
   `auth.admin.createUser`) e `quiz-email.service.ts` (lê a row para enviar o
   e-mail). O ADR 0005 cobre só o fluxo de convites. As duas razões são
   plausíveis (anônimo sem policy de leitura; criar conta sem sessão), mas a
   regra do projeto exige a exceção documentada. Ponto de parada do blueprint.
2. **`send-email` usa o `id` como única credencial** e limita por `id` em memória
   de uma instância. Está documentado como decisão ("by design"), mas quem
   souber o UUID pode disparar e-mails para o dono. Vale registrar como risco
   aceito ou trocar por um token como o `k` do `account`.
3. **Limite por IP e por `id` em memória** (`checkRateLimit`): comentado no
   código como "speed bump". O limite real está no banco (`quiz_submission_status`).
4. **Policies redefinidas várias vezes** (`Public can submit quiz responses`
   em 4 migrations): correto, mas sem teste pgTAP o estado final só se confirma
   lendo a última migration.

## Resumo

| Estado | Camadas |
|---|---|
| ok | 1, 2 |
| parcial | 4, 6, 8, 11, 12 |
| falta | 3, 5, 7, 9, 10, 14 (decidir) |
| n/a | 13 |

O dado já está bem protegido (RLS, RPCs, limites no banco). O que falta é a
estrutura de código acima dele: entity, repository, service de servidor e
camada de query. Próximo modo sugerido: `modo plan quiz`.

---

# Plano

> Modo `plan`: só documento. Cada grupo é um commit e termina com a
> verificação da skill (`npm run verify`, mais `build` e e2e quando mexe em
> página). Os testes de cada camada entram no mesmo grupo, nunca no fim.

## Decisões suas antes de começar

| # | Decisão | Por que trava | Minha sugestão |
|---|---|---|---|
| D1 | `service_role` em `account` e `quiz-email`: escrever um ADR (ou ampliar o 0005) aceitando como exceção, ou trocar por RPC `security definer` | Regra do projeto: exceção só com ADR, e só dentro de um service | ADR curto. Criar usuário exige `auth.admin`, que só existe com `service_role`; para a leitura da row no e-mail, uma RPC resolveria, mas é migration extra e baixo ganho |
| D2 | `send-email` com `id` como única credencial | É risco de spam ao dono do e-mail | Manter e registrar como risco aceito no ADR da D1; mudar para token é outra tarefa |
| D3 | Quiz entra em `lib/agents` (leitura do próprio diagnóstico)? | Camada 14 | Não agora. Só depois de o service existir, e como `appointments.*`: leitura, papel mentee |
| D4 | Instalar `@asteasolutions/zod-to-openapi` | Dependência nova (ponto de parada) | Sim, no grupo 3, só depois de eu te avisar |

## Grupos, em ordem

### Grupo 1 · Entity e Zod (camadas 3–4) · sem migration
- `lib/domain/quiz/quiz.entity.ts`: `Quiz`, `QuizSummary`, `QuizResultView` derivados da Row (`Pick`); `QuizAnalysis` vira tipo inferido do Zod. Funções puras: `isAnalysisReady`, `needsRetake`.
- `lib/schemas/quiz.ts`: `quizAnalysisSchema` (valida o `ai_analysis` em vez do `as unknown as`), schemas de saída das 4 rotas de leitura, `quizIdParamSchema` (UUID), body do `account`. `QuizSubmitInput` passa a ser `z.infer` (remove a interface duplicada).
- Testes: schemas (aceita análise válida, rejeita malformada, rejeita id não UUID).
- Risco: baixo. `lib/types/models/quiz.ts` vira re-export só até os imports migrarem, no mesmo commit (regra: sem re-export temporário, então atualizo todos os imports).

### Grupo 2 · Servidor (camadas 5–8) · sem migration
- Camada 5: `lib/repositories/quiz.repository.ts` (interface + fábrica que recebe o client). Concentra os 4 `from("quiz_responses")` e as 4 RPCs (`get_quiz_result`, `owns_quiz_response`, `claim_quiz_analysis`, `save_quiz_analysis`, `quiz_submission_status`). Remove o `rpc as any`.
- Camada 6: `lib/ports/mailer.ts` (interface) + adapter Brevo; o service recebe o mailer por parâmetro.
- Camada 7: `lib/services/quiz/quiz.server.service.ts`: `submit` (limite, e-mail da sessão), `getResult`, `getLatest`, `runAnalysis` (claim → mentores → analisar → salvar → e-mail), `sendResultsEmail`, `createAccountFromResults`. O `quiz.service.ts` atual (fetch do cliente) passa para os hooks do grupo 4.
- Camada 8: as 6 rotas ficam em auth → Zod → service → status. **Formato de resposta não muda**, para o app atual continuar funcionando (ponto de parada se precisar mudar).
- `service_role`: só dentro do service/repository de `account` e do e-mail, conforme o ADR da D1.
- Testes: repository (client fake), service com repository e mailer falsos, e as rotas hoje sem teste (`[id]`, `latest`, `analyze`, `account`, `send-email`). `route.test.ts` existente segue passando sem mudança.
- Risco: **médio**. `analyze` é o fluxo com claim atômico e cobrança de IA; o service mantém a ordem e o `recordAiCalls` exatamente como está. Valido comparando as chamadas ao RPC no teste.

### Grupo 3 · Contrato (camada 9) · depende de D4
- `lib/openapi/paths/quiz.ts` gerado dos schemas do grupo 1, mais o teste de drift (`npx jest lib/openapi`).
- Risco: baixo; para antes de instalar a dependência.

### Grupo 4 · Cliente (camadas 10–11)
- `lib/query/keys.ts` com `quizKeys` e `lib/query/effects.ts`: enviar o quiz invalida `quizKeys.latest` (caso 1 do ADR: dashboard atualiza).
- `hooks/quiz/`: `useQuizResult` (com o polling hoje em `useEffect`), `useLatestQuiz`, `useSubmitQuiz`, `useQuizDraft` (rascunho em `localStorage`, caso 2 do ADR).
- Páginas: `results/[id]/page.tsx` (474 linhas) quebrada em componentes (<150 linhas cada); remove o import morto de `createClient`.
- Testes: hooks e componentes; e2e: preencher o quiz até o fim com a API mockada.
- Risco: **médio**, é UI. Passo a passo manual para você validar o fluxo completo (enviar, ver resultado, dashboard atualizado, rascunho).

### Grupo 5 · Agentes (camada 14) · só se D3 = sim
- Capability de leitura do diagnóstico em `lib/agents/capabilities/`, liberada no assistente e nunca no MCP público.

## Pontos de parada que este plano vai tocar
1. D1: ADR de `service_role` (antes do grupo 2).
2. D4: dependência do OpenAPI (antes do grupo 3).
3. Grupo 4 muda a UI: você valida antes de eu seguir para o 5.

Nenhum grupo precisa de migration nova.
