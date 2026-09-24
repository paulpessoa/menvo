# Plano — Menvo AI-First: Diagnóstico Agêntico, Copiloto, Medição de Uso e Base de Conhecimento

> **Status:** proposta aprovada, 2026-09-23. **Já implementado (Fase 0,
> quase completa):** §5 `ai_usage_events`, `ai_model_pricing`, `ai_entitlements`,
> `ai_quota_ledger`, `ai_budget` (corte duro em 100%, sem degradação a 80%),
> RPCs `consume_ai_quota`/`get_ai_quota`/`record_ai_usage`, ligados em
> `/api/ai/match`, `/api/assistant` e no match da lista de espera, e o painel
> `/dashboard/admin/ai-usage`. Migração `20260923000002` aplicada em 2026-09-23.
> RLS de `quiz_responses` corrigida e aplicada (`…000005`). Registro de
> modelos por capacidade (`lib/ai/models`, [ADR 0004](governance/adr/0004-model-registry-by-capability.md))
> implementado em código — a medição do LangChain agora é um callback por
> modelo (`lib/ai/metering/callback.ts`), não mais `streamEvents`
> (`lib/ai/langchain-metering.ts`, removido). Migrações `…000004` e `…000006`
> escritas, aguardando o fundador aplicá-las. Protocolo SSE tipado com Zod
> (`lib/ai/protocol.ts`) e ADRs 0001–0004 + `docs/governance/ai-policy.md`
> **feitos** (2026-09-24) — Fase 0 completa em código, restando só a
> degradação a 80% do orçamento (§3.4) e as migrações pendentes acima.
> Ver o diário do `STATUS.md`.
> **Para quem executa:** leia §0 (estado atual) e §1 (princípios) antes de
> qualquer fase. As decisões do fundador estão em §9, os preços dos modelos
> em §11 e privacidade/retenção em §12.
>
> **Objetivo duplo:** (1) oferecer uma experiência AI-first real aos usuários
> da Menvo gastando pouco (bootstrapping); (2) construir um núcleo de
> plataforma de IA (`lib/ai/`) desacoplado do domínio da Menvo, reaproveitável
> em projetos de clientes.

---

## 0. Estado atual (auditado em 2026-09-23)

| Peça | Onde | Situação |
|---|---|---|
| Assistente in-app | `app/[locale]/assistant/page.tsx`, `app/api/assistant/route.ts`, `lib/services/assistant/agent.ts` | `createReactAgent` (LangGraph prebuilt), 4 tools, atrás de `ai_assistant_flag` |
| Tools | `lib/services/assistant/tools.ts` | `searchMentors`, `getMentorAvailability`, `explainHowItWorks`, `saveFeedback` |
| MCP público | `app/api/mcp/[transport]/route.ts` | Mesmas tools, só leitura, sem auth |
| Quiz | `/quiz`, `components/quiz/*`, `lib/services/quiz/quiz.service.ts` | Formulário de 8 passos, anônimo, grava direto do client por e-mail |
| Análise do quiz | `supabase/functions/analyze-quiz` | Edge Function, `gpt-3.5-turbo`, `service_role` |
| Match por IA | `app/api/ai/match`, `lib/services/ai/groq.service.ts` | Separado, `gpt-4o-mini` + fallback determinístico |
| Voz | `components/ui/voice-input.tsx` | Web Speech API do navegador (custo zero) |
| Evals | `evals/` | `eval:match` (20 casos), `test:evals` (assistente) |
| Log | `assistant_conversations` | Só texto (`user_message`, `ai_response`); sem tokens, custo, modelo |

**Dívidas que bloqueiam a expansão (corrigir na Fase 0):**

1. **Rate limit em memória** (`lib/rate-limit.ts`): no Vercel cada instância
   serverless tem seu próprio `Map`. O limite "30/dia" na prática não existe.
   Nenhuma cota ("1 diagnóstico por mês") pode ficar em memória.
2. **Não há fallback de modelo**: `agent.ts` instancia Groq e Gemini mas só
   usa Gemini (comentário: `withFallbacks` não funciona com `createReactAgent`).
   Se o Gemini cair, o assistente cai.
3. **`searchMentors` devolve linhas inteiras** (`any[]`) para o LLM: gasta
   tokens e expõe campos que não precisavam sair. Precisa de um DTO enxuto
   para o modelo e um separado para os cards da UI.
4. **Não há medição**: nenhum token, custo, latência ou modelo é registrado.
5. **Três stacks de LLM diferentes** (OpenAI na Edge Function, OpenAI no
   match, LangChain Gemini/Groq no assistente), cada uma com sua própria
   chave, prompt e sem visão consolidada de custo.
6. **`@langchain/langgraph`** é importado em `agent.ts` mas não está no
   `package.json` (entra como dependência transitiva de `langchain`). Tem que
   ser declarado explicitamente, com versão fixada.
7. **Quiz sem `user_id`**: o vínculo é por e-mail, gravado pelo client. Não
   serve para controlar cota nem para dar contexto ao copiloto.
8. **RLS de `quiz_responses` desconhecida**: nenhuma migração versionada cria
   policy para essa tabela (vieram das baselines vazias), e o client lê
   resultados por `id` sem login (`/quiz/results/[id]`). Auditar as policies
   no banco real antes da Fase 1: o diagnóstico logado precisa ser privado (§12).
9. **Modelos caros ou legados sem motivo**: o assistente referencia
   `qwen/qwen3.8-27b` no Groq (US$ 0,80/US$ 4,00 por MTok, mais caro que o
   Gemini em uso), e a Edge Function usa `gpt-3.5-turbo` (legado). Ver §11.

---

## 1. Princípios de arquitetura (valem para todas as fases)

1. **LLM nas bordas, determinismo no meio.** O roteiro do diagnóstico
   (perguntas, ordem, chips) é código, não prompt. O LLM só entra para
   (a) interpretar texto/voz livre em campos estruturados, (b) fazer uma
   pergunta de aprofundamento quando a resposta é vaga, (c) gerar a análise
   final. Clique em chip = **zero tokens**.
2. **Cota e orçamento no Postgres, nunca em memória.** Toda chamada de LLM
   passa por um *gate* (`consume_ai_quota`) e deixa um registro de uso
   (`ai_usage_events`). Sem registro, sem chamada.
3. **Modelo é configuração, não código.** Cada nó do grafo pede uma
   *capacidade* (`extract`, `converse`, `analyze`, `route`), e um registro
   (`lib/ai/models`) resolve para provedor + modelo + fallback. Trocar de
   modelo é mudar uma linha no banco, sem deploy.
4. **Permissão no servidor, não no prompt.** As tools disponíveis são
   filtradas pelo papel do usuário **antes** de montar o grafo. Um prompt
   injection não consegue chamar uma tool que o grafo não tem. Toda escrita
   usa o cliente Supabase da sessão do usuário (RLS continua valendo).
5. **Escrita exige confirmação.** Toda tool que altera dados (perfil,
   agendamento, cancelamento) devolve uma *proposta* com chips
   "Confirmar / Cancelar"; só executa no clique. (Human-in-the-loop.)
6. **Núcleo reaproveitável.** `lib/ai/` não importa nada de
   `lib/services/*` da Menvo. A Menvo registra tools, prompts e fluxos em
   `lib/ai-menvo/` (ou `features/*`). Esse é o pedaço que vira template para
   clientes.
7. **Tudo mensurável por usuário × papel × funcionalidade × modelo.**

---

## 2. Arquitetura-alvo

```
UI (um chat só: /assistant)                      Protocolo SSE tipado (Zod)
  ├─ ChatThread (mensagens + UI generativa)     ─┐  text | chips | mentor_cards |
  ├─ Composer (texto + mic Web Speech)           │  progress | confirm_action |
  └─ ChipGroup (single / multi / "outro")        │  quota | error | done
                                                 ▼
POST /api/ai/chat  ──►  auth → papel → flags → gate de cota → carrega thread
                                                 │
                                                 ▼
                         LangGraph StateGraph "menvo-copilot"
                         ┌──────────────┐
          entrada ──────►│   router     │ (determinístico primeiro; LLM barato só se ambíguo)
                         └──┬────┬────┬─┘
            ┌───────────────┘    │    └────────────────┐
            ▼                    ▼                     ▼
   subgrafo diagnostic   subgrafo assistant     subgrafo feedback
   (máquina de estados)  (agente com tools      (NPS / sessão /
   ask → extract →       filtradas por papel,   plataforma)
   followup? → next …    limites de chamadas)
   → analyze → match
                                                 │
                                                 ▼
   lib/ai/models (registro + fallback) ── lib/ai/metering (callback → ai_usage_events)
                                                 │
                                                 ▼
   Postgres: ai_threads · ai_messages · diagnostic_sessions · ai_usage_events ·
             ai_quota_ledger · ai_entitlements · ai_model_config · ai_model_pricing
```

### 2.1 Um chat só, vários modos

Recomendação: **um único chat** (`/assistant`), com o diagnóstico como um
*modo* (subgrafo) dentro dele, e não dois produtos separados. Motivos:
o usuário não precisa aprender onde fica cada coisa; o resultado do
diagnóstico vira contexto imediato do copiloto ("com base no seu
diagnóstico, estes 3 mentores…"); e é uma pilha só para manter.
O `/quiz` público **continua existindo** como formulário anônimo (uso em
eventos, sem login), mas os links internos que levam ao diagnóstico
(`MenteeQuizCTA`, `QuizDiscoverySection`, `/mentors`, `NotFoundClient`,
dashboard do mentorado) passam a apontar para o chat no modo diagnóstico
(`/assistant?mode=diagnostic`). Ver §9, D1.

### 2.2 Por que `StateGraph` próprio e não `createReactAgent`

- O diagnóstico é uma máquina de estados com slots. Um agente ReAct genérico
  gasta tokens decidindo "qual a próxima pergunta", uma coisa que o código já sabe.
- No grafo próprio, `model.bindTools(tools).withFallbacks([...])` funciona
  (o problema atual é exclusivo do prebuilt).
- No subgrafo `assistant`, usar `createAgent` do `langchain` v1 **com
  middlewares** (limite de chamadas de modelo/tool, fallback de modelo,
  sumarização de histórico), se a versão instalada tiver. **Verificar na
  documentação do pacote instalado, não na memória.**

### 2.3 Estado e persistência (sem checkpointer na Fase 1)

O `PostgresSaver` do LangGraph conecta com uma role de banco e **ignora RLS**,
o que viola o `AGENTS.md`. Por isso, na Fase 1:

- O grafo é invocado **sem estado no servidor** a cada request.
- O estado vive em tabelas próprias com RLS: `ai_threads`, `ai_messages`,
  `diagnostic_sessions.state jsonb` (slots preenchidos, passo atual,
  contagem de follow-ups).
- A rota carrega o estado → invoca o grafo → persiste o novo estado.
- Checkpointer só entra se surgir um caso de `interrupt()` longo que as
  tabelas próprias não cubram. Registrar como ADR se acontecer.

---

## 3. Fase 1: diagnóstico agêntico (o quiz virando conversa)

### 3.1 Fluxo

| # | Pergunta (atual) | Entrada no chat | LLM? |
|---|---|---|---|
| 1 | Momento de carreira | Chips de escolha única + "outro" livre | Só se "outro" |
| 2 | Desafio atual | Texto ou voz | `extract` + até 1 follow-up se vaga |
| 3 | Experiência com mentoria | Chips | Não |
| 4 | Visão de futuro | Texto ou voz | `extract` + até 1 follow-up |
| 5 | Áreas de desenvolvimento | Chips múltiplos + "outro" | Só se "outro" |
| 6 | Vida pessoal | Texto ou voz (pode pular) | `extract` |
| 7 | Compartilhar conhecimento | Chips | Não |
| — | Nome/e-mail | **Removido** (vem da sessão) | — |
| F | Análise + mentores sugeridos | Cards | `analyze` (1 chamada) + `searchMentors` |

- Todo passo aceita texto livre, mesmo onde há chips. Se o usuário digitar
  em vez de clicar, o nó `extract` mapeia para a opção (saída estruturada
  com Zod: `{ value: enum | null, confidence }`). Se `confidence` for baixa,
  os chips aparecem de novo.
- O texto das perguntas e dos chips vem de `messages/{locale}.json`
  (reaproveita as chaves `quiz.quiz_form.*`), sem LLM, sem custo, e com i18n.
- Os schemas dos slots reaproveitam `lib/schemas/quiz.ts` (fonte única).
- Resultado grava em `quiz_responses` **com `user_id`** (nova coluna) e
  `diagnostic_session_id`, para a tela `/quiz/results/[id]` continuar
  funcionando. A análise sai da Edge Function com OpenAI e passa para o grafo
  (Next.js, `analyze` pelo registro de modelos). A Edge Function fica só
  para o fluxo anônimo até ele ser desligado.

### 3.2 Voz

- **Fase 1:** Web Speech API (`voice-input.tsx`, já existe). O transcript vai
  como texto. Custo zero. Mostrar o transcript editável antes de enviar.
- **Fase 3 (se necessário):** STT no servidor (ex.: Whisper via Groq) para
  navegadores sem suporte (Firefox, alguns iOS). Medido como funcionalidade
  `stt` (segundos de áudio) e com cota própria. Só fazer se o dado mostrar
  demanda (medir `voice_unsupported` no client antes).

### 3.3 Uma vez por mês, e o que conta como "uma vez"

- **Crédito consumido na geração da análise**, não ao abrir o chat.
  Abandonar e voltar no mesmo mês retoma a sessão (`diagnostic_sessions`
  com `status in ('in_progress','completed','abandoned')`).
- Uma sessão em andamento expira em 7 dias; depois disso vira `abandoned`
  **sem** consumir crédito.
- Tetos duros por sessão: no máximo 25 turnos, 2 follow-ups por pergunta
  aberta e 1.500 caracteres por resposta. Estourou, o grafo avança
  sozinho para o próximo passo.
- Refazer no mesmo mês: o usuário vê o resultado anterior e a data em que
  libera ("seu próximo diagnóstico gratuito fica disponível em 01/10").
- **Período = mês-calendário em `America/Sao_Paulo`** (decisão D2).
  `period_start = date_trunc('month', now() at time zone 'America/Sao_Paulo')`.
  Um diagnóstico iniciado em 30/09 e concluído em 02/10 consome o crédito de
  outubro (o crédito conta na conclusão).
- **Qualquer usuário logado pode fazer** (decisão D4): a base de todo
  usuário é "mentorado"; mentores e admins também têm direito a 1 por mês.

### 3.4 Anti-abuso (camadas)

1. **Por usuário:** `ai_entitlements` (limite por papel × funcionalidade × período).
2. **Por requisição:** tamanho do input, número de mensagens de histórico
   enviadas ao modelo (janela + resumo), `recursionLimit`, limite de
   chamadas de tool por turno.
3. **Global (disjuntor):** orçamento mensal da plataforma de **US$ 10,00**
   (decisão D3), em `ai_budget`, editável pelo admin. Com 50% gasto, o admin
   recebe e-mail de aviso; com 80%, as capacidades caras passam para o modelo
   mais barato da §11; com 100%, o chat vira "modo só chips" (o diagnóstico
   continua, a análise entra em fila e é gerada no mês seguinte ou quando o
   admin aumentar o teto) e o admin recebe outro e-mail. Pela estimativa da
   §11.3, US$ 10 cobrem cerca de 1.500 diagnósticos, ou 2.500 turnos do
   copiloto, por mês.
4. **Conta:** só usuário logado e com e-mail confirmado usa o chat.

---

## 4. Fase 2: copiloto por papel

### 4.1 Capacidades por papel

Registro de tools (`lib/ai/tools/registry.ts`) com metadados:
`{ name, roles: Role[], kind: 'read'|'write', requiresConfirmation, costTier }`.

| Capacidade | Mentorado | Mentor | Admin de org | Admin |
|---|:-:|:-:|:-:|:-:|
| Diagnóstico mensal | ✓ | ✓ | ✓ | ✓ |
| Compartilhar/revogar meu diagnóstico com um mentor | ✓ | ✓ | ✓ | ✓ |
| Ver diagnóstico compartilhado comigo (só leitura) | — | ✓ | — | — |
| Sugerir mentores (a partir do diagnóstico) | ✓ | — | — | ✓ |
| Ver disponibilidade de um mentor | ✓ | ✓ | ✓ | ✓ |
| Minha agenda / próximas sessões | ✓ | ✓ | — | ✓ |
| Pendências ("o que falta eu fazer") | ✓ | ✓ | ✓ | ✓ |
| Completar/atualizar perfil (com confirmação) | ✓ | ✓ | — | — |
| Confirmar/recusar solicitações (com confirmação) | — | ✓ | — | — |
| Configurar disponibilidade (guiado) | — | ✓ | — | — |
| Preparar sessão (usa o diagnóstico **só se** compartilhado, §12.2) | — | ✓ | — | — |
| Plano de ação pós-sessão | ✓ | — | — | — |
| Resumo da organização | — | — | ✓ | ✓ |
| Uso de IA / custos | — | — | — | ✓ |
| Feedback (atendimento, sessão, plataforma) | ✓ | ✓ | ✓ | — |
| Tirar dúvidas da plataforma (base de conhecimento) | ✓ | ✓ | ✓ | ✓ |

### 4.2 Briefing ao abrir o chat (sem LLM)

Ao abrir `/assistant`, uma função determinística `getUserBriefing(userId)`
monta um cartão: pendências (sessão para avaliar, solicitação para
confirmar, perfil incompleto, diagnóstico disponível), próxima sessão e
chips de atalho. Custo zero. É o que faz o chat parecer proativo sem gastar
um token.

Reaproveitar `lib/mentorship/group-appointments.ts` (ciclo de vida derivado)
e `hooks/useMyAppointments.ts` (a lógica de servidor por trás) para as
pendências de sessão.

### 4.3 Feedback ativo

Gatilhos (determinísticos; o LLM só entra para ler o comentário livre):

- Fim do diagnóstico: "Esse diagnóstico te ajudou?" (chips 1–5).
- Sessão concluída sem avaliação: aparece no briefing, com o fluxo de avaliação
  dentro do chat (substitui o write direto no client que hoje viola o BFF,
  ver STATUS 2026-09-23).
- Pesquisa de plataforma: no máximo 1 a cada 60 dias por usuário.
- Grava em `feedback` com `source` (`assistant`, `diagnostic`, `session`)
  e `context jsonb`. O LLM classifica o tema do comentário em lote
  (job diário, modelo barato), e não no request.

### 4.4 Contexto e memória

- System prompt = regras fixas + **cartão de perfil compacto** (papel,
  momento de carreira, áreas, resumo do último diagnóstico em ≤ 400 tokens).
  Nada de e-mail, telefone ou sobrenome no prompt.
- Histórico: últimas 10 mensagens + resumo rolante (`ai_threads.summary`)
  atualizado por um nó barato quando passa do limite.
- Prefixo do prompt estável para aproveitar cache de prompt dos provedores.

---

## 5. Medição de uso de IA

### 5.1 Modelo de dados

```sql
-- Um registro por chamada de modelo/serviço de IA. Fonte da verdade de custo.
ai_usage_events (
  id uuid pk, created_at timestamptz,
  user_id uuid, role text,                 -- papel no momento da chamada
  organization_id uuid null,
  feature text,      -- diagnostic | assistant | match | analyze | stt | feedback_classify | kb_search
  node text,         -- nó do grafo: extract, followup, analyze, router…
  thread_id uuid null, run_id uuid,        -- agrupa as chamadas de um turno
  provider text, model text,
  input_tokens int, output_tokens int, cached_input_tokens int,
  audio_seconds numeric null,
  latency_ms int,
  cost_usd numeric(12,6),                  -- calculado na gravação via ai_model_pricing
  status text,       -- ok | error | fallback | blocked_quota | blocked_budget
  error_code text null
)

ai_model_pricing (provider, model, input_per_mtok, output_per_mtok,
                  cached_input_per_mtok, per_audio_minute, effective_from)
ai_model_config  (capability, provider, model, params jsonb,
                  fallback jsonb, active bool)     -- troca de modelo sem deploy
ai_entitlements  (role, feature, period, limit_count, limit_tokens)
ai_quota_ledger  (user_id, feature, period_start, used_count, used_tokens)
ai_budget        (month, limit_usd, spent_usd)      -- disjuntor global
```

### 5.2 Captura

- **Um único callback handler do LangChain** (`lib/ai/metering/callback.ts`),
  anexado a todo modelo criado pelo registro. Lê `usage_metadata` no
  `handleLLMEnd`, mede a latência e grava o evento. Nenhuma feature precisa
  lembrar de medir.
- O match (`groq.service.ts`) e a análise antiga (Edge Function) migram
  para o registro de modelos, ou gravam o evento manualmente até migrarem.

### 5.3 Segurança das tabelas de medição

- RLS: o usuário **lê** só as próprias linhas de `ai_usage_events` e
  `ai_quota_ledger`; admin lê tudo (via `is_platform_admin()` security definer,
  mesmo padrão de `is_org_admin()`).
- **Nenhuma** policy de insert/update/delete para `authenticated`. A escrita
  acontece só por RPCs `security definer` (`record_ai_usage`,
  `consume_ai_quota`) que usam `auth.uid()` internamente e ignoram qualquer
  `user_id` vindo do client. No pior caso o usuário consome a própria cota,
  e não consegue devolvê-la nem mexer na de outro. Sem `service_role`.
- `consume_ai_quota` é atômica (`insert … on conflict do update … where
  used_count < limit returning`) para não haver corrida entre duas abas.

### 5.4 O que medir (painel `/dashboard/admin/ai-usage`)

- Custo total, por funcionalidade, por papel, por modelo; tendência diária.
- Custo por usuário ativo/mês; top 20 usuários por custo (detecção de abuso).
- Diagnóstico: iniciados, concluídos, taxa de conclusão, turnos médios,
  % de respostas via chip vs texto vs voz, custo médio por diagnóstico.
- Taxa de fallback e de erro por provedor; latência p50/p95.
- Funil de valor: diagnóstico concluído → perfil de mentor visto →
  sessão agendada → sessão avaliada. **Custo de IA por sessão agendada** é a
  métrica que justifica (ou não) o investimento.
- Views agregadas (`ai_usage_daily`) para o painel não varrer eventos crus.

### 5.5 Traces (opcional, depuração)

Langfuse (open source, tem plano gratuito ou self-host) plugado no mesmo
callback, para inspecionar prompts e passos do grafo. O banco continua sendo a
fonte da verdade de negócio, e o trace serve para depurar. Desligável por
env var.

---

## 6. Base de conhecimento e governança da documentação

### 6.1 Dois públicos, duas árvores

```
docs/                         ← INTERNO: engenharia e governança (inglês ou pt, como hoje)
  README.md                   mapa da documentação + como manter
  STATUS.md                   (existente) estado, backlog, diário
  VISION.md                   (existente)
  governance/
    adr/NNNN-titulo.md        decisões de arquitetura (skill create-adr já existe em .agent/)
    ai-policy.md              modelos permitidos, orçamento, dados que podem ir ao LLM, retenção, LGPD
    doc-standards.md          frontmatter obrigatório, revisão, definição de pronto
    glossary.md               mentorado, mentor, org, sessão, diagnóstico, crédito…
  architecture/
    overview.md               contexto e containers (C4 nível 1–2), fluxo BFF
    data-model.md             ERD por domínio (mermaid) + tabelas e RLS
    security.md               RLS, security definer, auth, rate limit
    ai-platform.md            este plano, depois de implementado, vira a referência
  domains/                    um arquivo por domínio de negócio
    auth-and-roles.md  profiles.md  mentor-catalog.md
    scheduling.md (← SCHEDULING_AND_AVAILABILITY.md)
    mentorship-lifecycle.md  evaluations.md
    organizations.md (← MULTI_TENANT_ROADMAP.md)
    diagnostic.md  notifications-email.md  feature-flags.md  admin.md
  operations/
    environment-variables.md (← ENVIRONMENT_VARIABLES.md)
    deploy.md  cron-jobs.md  runbooks/ (IA fora do ar, orçamento estourado…)
  product/
    roadmap.md  seo.md (← SEO_GUIDE.md)

kb/                           ← EXTERNO: o que o copiloto pode ler e citar (pt-BR)
  _index.json                 gerado no build: id, título, papéis, tags, resumo
  comecando/                  o que é a Menvo, é gratuito?, como criar conta
  mentorados/                 como achar mentor, agendar, preparar, avaliar, diagnóstico
  mentores/                   como virar mentor, verificação, disponibilidade, Google Calendar
  organizacoes/               o que é org parceira, entrar, convites
  politicas/                  código de conduta, privacidade, uso de IA
  faq/
```

**Frontmatter obrigatório** em todo arquivo de `kb/` e `docs/domains/`:

```yaml
---
title: Como agendar uma sessão
audience: [mentee]            # kb: papéis que podem receber esse conteúdo
owner: paul
status: current               # draft | current | deprecated
last_reviewed: 2026-09-23
source_of_truth: [app/api/appointments/schedule/route.ts]   # código que isto descreve
---
```

### 6.2 Como o modelo usa a KB

- **Fase 2:** tool `searchKnowledgeBase(query)` sobre `kb/_index.json`
  (busca por palavra-chave/tag, filtrada pelo papel do usuário). Com
  menos de ~100 artigos curtos isso basta e custa zero de embedding.
  Substitui o texto fixo de `explainHowItWorks`.
- **Quando migrar para pgvector:** quando o eval de KB (§7) passar a errar
  porque a busca por palavra-chave não encontra o artigo certo, ou quando a
  KB passar de ~100 artigos. Mantém a decisão de 2026-09-17 ("pgvector
  quando houver gatilho real").
- `public/llms.txt` / `llms-full.txt` passam a ser **gerados** a partir de
  `kb/` no build (fonte única).

### 6.3 Governança

- **Definição de pronto:** PR que muda comportamento de um domínio atualiza
  `docs/domains/<domínio>.md` e, se afetar o usuário, o artigo de `kb/`.
- **Decisões relevantes viram ADR** (template da skill `create-adr`).
  ADRs iniciais: 0001 LangGraph como orquestrador; 0002 estado em tabelas
  próprias em vez de checkpointer; 0003 cota e medição no Postgres via
  RPC security definer; 0004 modelo por capacidade + tabela de preços;
  0005 KB por palavra-chave antes de vetores.
- **Script `scripts/docs/check.ts`** (rodado no CI): frontmatter válido,
  links internos quebrados, `last_reviewed` com mais de 90 dias gera aviso,
  arquivo em `source_of_truth` que não existe mais gera erro.
- `STATUS.md` continua sendo o ponto de entrada para agentes e aponta para
  `docs/README.md`.

---

## 7. Qualidade: evals e testes

Estende o padrão de `evals/` (fora do `npm test`, roda antes de trocar
prompt ou modelo):

- `eval:diagnostic-extract`: ~40 respostas reais/sintéticas → slot esperado
  (inclui gírias, respostas vagas, voz com erro de transcrição).
- `eval:router`: mensagem → modo esperado (diagnostic/assistant/feedback).
- `eval:rbac`: mentorado tentando ações de mentor/admin → nenhuma tool
  indevida chamada (junto com teste unitário do filtro de tools).
- `eval:kb`: pergunta → artigo esperado citado.
- **Orçamento como teste:** cada eval registra tokens e custo médios. Um
  diagnóstico completo acima de X tokens (definir o baseline na Fase 1) falha.
- Unit tests co-localizados: máquina de estados do diagnóstico,
  `consume_ai_quota` (via teste de integração contra o banco local ou
  mock), o callback de medição e o parser do protocolo SSE.

---

## 8. Fases e ordem de execução

Cada fase termina com `tsc`, `npm test`, evals, `build` e registro no
diário do `STATUS.md`.

### Fase 0: Fundação (pré-requisito de tudo)
1. Declarar `@langchain/langgraph` no `package.json` com versão fixada.
2. `lib/ai/models`: registro por capacidade + `withFallbacks` + `ai_model_config`.
   Especificado em [ADR 0004](governance/adr/0004-model-registry-by-capability.md)
   (inclui itens 8 e 10; migração `20260923000004` escrita, não aplicada).
3. `lib/ai/metering`: callback + `ai_usage_events` + `ai_model_pricing` + RPC `record_ai_usage`.
4. `ai_entitlements` + `ai_quota_ledger` + RPC `consume_ai_quota`; trocar o
   rate limit em memória do `/api/assistant` pelo gate no banco.
5. `searchMentors`: DTO enxuto para o LLM, DTO de card para a UI.
6. **Feito (2026-09-24):** Protocolo SSE tipado com Zod (`lib/ai/protocol.ts`,
   `aiEventSchema`, `encodeSseEvent`/`encodeSseDone`/`parseSseLine`),
   compartilhado entre `app/api/assistant/route.ts` (encode) e
   `app/[locale]/assistant/page.tsx` (parse) — os dois lados não podem mais
   divergir no formato do evento. Não importa `lib/services/*` (o payload de
   `mentors_found` é registros opacos aqui; a validação com `mentorCardDto`
   já acontece em `lib/services/assistant/tools.ts` antes de chegar no SSE).
7. **Feito (2026-09-24):** ADRs 0001–0004 e `docs/governance/ai-policy.md`.
   Esqueleto de `docs/` e `kb/` já feito em 2026-09-23.
8. Seed de `ai_model_pricing` e `ai_model_config` com a §11; `ai_budget` com US$ 10.
9. Auditar a RLS real de `quiz_responses` (§0, item 8) e registrar o resultado no diário.
   **Feito (2026-09-23):** vazamento confirmado, corrigido e **aplicado**
   (`20260923000005_quiz_responses_privacy.sql`); código (`quiz.service.ts`,
   `org-dashboard.service.ts`, `/quiz/results/[id]`) atualizado no mesmo dia.
10. Aposentar `qwen/qwen3.8-27b` e `gpt-3.5-turbo` em favor do registro (§11.2).
    **Feito em código (2026-09-23):** nenhuma referência a `qwen/qwen3.8-27b`
    ou `gpt-3.5-turbo` resta em `lib/`, `app/` ou `supabase/functions/`; ver
    ADR 0004 §7. Falta aplicar as migrações `…000004`/`…000006`.

### Fase 1: Diagnóstico agêntico
1. Migração: `diagnostic_sessions`, `ai_threads`, `ai_messages`, `quiz_responses.user_id`.
2. Subgrafo `diagnostic` (máquina de estados + nós `extract`/`followup`/`analyze`).
3. UI: `ChipGroup`, cards, barra de progresso, mic, estado "crédito usado / disponível em".
4. Resultado em `quiz_responses` → `/quiz/results/[id]` continua funcionando.
5. Links internos de diagnóstico → `/assistant?mode=diagnostic`. O `/quiz`
   anônimo continua como está (eventos). Usuário logado que abre `/quiz`
   vê um aviso com botão "Fazer no chat", sem redirecionamento forçado.
6. RLS de privacidade: diagnóstico logado visível só para o dono (§12.2).
7. Aviso de IA no primeiro uso do chat + textos de privacidade/termos (§12.3).
8. Evals de extração + baseline de custo por diagnóstico.

### Fase 2: Copiloto por papel (só leitura + feedback)
1. `router` + registro de tools com RBAC.
2. Briefing determinístico ao abrir.
3. Tools de leitura: agenda, pendências, disponibilidade, KB.
4. Feedback ativo (diagnóstico, sessão, plataforma).
5. Painel `/dashboard/admin/ai-usage`.
5b. Compartilhamento do diagnóstico com mentor (§12.2): tabela, RLS,
    opção no agendamento e em `/profile`, visão só-leitura para o mentor.
5c. Job de retenção (cron) aplicando os prazos da §12.1.
6. Artigos iniciais de `kb/` (≈20) + geração de `llms.txt`.

### Fase 3: Ações com confirmação
1. Tools de escrita com `confirm_action` (perfil, confirmar/recusar
   solicitação, avaliação de sessão, que corrige também a violação do BFF).
2. Preparação de sessão para o mentor (com consentimento do mentorado).
3. Disjuntor de orçamento global + e-mail ao admin.
4. STT no servidor, **se** o dado de `voice_unsupported` justificar.

### Fase 4: Escala (sob gatilho)
pgvector para KB/mentores, plano de ação pós-sessão, digest semanal
proativo por e-mail, créditos extras (se um dia houver monetização),
exportação do núcleo `lib/ai/` como pacote/template para clientes.

---

## 9. Decisões do fundador (2026-09-23)

| # | Decisão | Resolução |
|---|---|---|
| D1 | O `/quiz` anônimo continua? | **Sim**, para uso em eventos. Links internos de diagnóstico passam para o chat. |
| D2 | Período da cota | **Mês-calendário** (`America/Sao_Paulo`). |
| D3 | Orçamento mensal de IA | **US$ 10,00**, editável pelo admin; revisar com o painel após o 1º mês. |
| D4 | Quem faz diagnóstico | **Qualquer usuário logado** (a base de todo usuário é mentorado). |
| D5 | Modelos padrão | Ver §11.2 (preços pesquisados em 2026-09-23). |
| D6 | Retenção | Ver §12.1 (sugestão do Claude, fundador delegou). |
| D8 | Aposentar `gpt-3.5-turbo` do `analyze-quiz` | **Opção A** (2026-09-23): a análise vai para uma rota Next.js no registro de modelos, medida e dentro do teto. Ver ADR 0004 §7.3. |
| D7 | Privacidade do diagnóstico | **Privado por padrão.** O usuário pode compartilhar com um mentor, que passa a ver os insights para trabalhar na mentoria. Revogável. Ver §12.2. |

---

## 10. O que torna isto reaproveitável em clientes

O núcleo `lib/ai/` sai da Fase 0–1 com fronteiras claras:

| Módulo | Responsabilidade | Depende da Menvo? |
|---|---|---|
| `lib/ai/models` | Registro por capacidade, fallback, config no banco | Não |
| `lib/ai/metering` | Callback, eventos, preços, custo | Não |
| `lib/ai/quota` | Entitlements, ledger, disjuntor | Não |
| `lib/ai/protocol` | Eventos SSE tipados + hook React de consumo | Não |
| `lib/ai/tools` | Registro com RBAC e confirmação | Não (a Menvo registra as suas) |
| `lib/ai/flows` | Helper para "questionário conversacional" (slots + chips + extract) | Não |
| `lib/ai-menvo/*` | Tools, prompts, fluxo de diagnóstico, briefing | Sim |

+ as migrações de `ai_*` e o `docs/governance/ai-policy.md` como template.

---

## 11. Modelos e preços (pesquisado em 2026-09-23)

> Fontes oficiais: [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing),
> [Groq models](https://console.groq.com/docs/models),
> [OpenAI pricing](https://developers.openai.com/api/docs/pricing),
> [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).
> Preço muda: a tabela `ai_model_pricing` tem `effective_from` e deve ser
> revisada a cada trimestre (lembrete no `STATUS.md`).

### 11.1 Tabela de preços (USD por 1M tokens, tier pago padrão)

| Provedor | Modelo | Entrada | Entrada em cache | Saída | Obs. |
|---|---|---:|---:|---:|---|
| Google | `gemini-2.5-flash-lite` | 0,10 | 0,01 | 0,40 | áudio entrada 0,30 |
| Google | `gemini-3.1-flash-lite` | 0,25 | 0,025 | 1,50 | áudio entrada 0,50 |
| Google | `gemini-3.5-flash-lite` | 0,30 | — | 2,50 | modelo atual do assistente; sem cache |
| Google | `gemini-2.5-flash` | 0,30 | 0,03 | 2,50 | áudio entrada 1,00 |
| Google | `gemini-3.8-flash` | 0,75 | 0,075 | 3,75 | até 31/12/2026; **1,50 / 0,15 / 7,50 a partir de 01/01/2027** |
| Google | `gemini-3.5-flash` | 1,50 | 0,15 | 9,00 | |
| Groq | `openai/gpt-oss-20b` | 0,075 | — | 0,30 | |
| Groq | `openai/gpt-oss-120b` | 0,15 | — | 0,60 | |
| Groq | `qwen/qwen3.8-27b` | 0,80 | — | 4,00 | preview; hoje referenciado no código, **aposentar** |
| Groq | `whisper-large-v3-turbo` | — | — | — | **US$ 0,04 / hora de áudio** (STT) |
| Groq | `whisper-large-v3` | — | — | — | US$ 0,111 / hora de áudio |
| OpenAI | `gpt-5-nano` | 0,05 | 0,005 | 0,40 | |
| OpenAI | `gpt-4o-mini` | 0,15 | 0,075 | 0,60 | usado hoje no match |
| OpenAI | `gpt-5-mini` | 0,25 | 0,025 | 2,00 | |
| OpenAI | `gpt-4o-mini-transcribe` | — | — | — | US$ 0,003 / minuto |
| Anthropic | `claude-haiku-4-5` | 1,00 | 0,10 | 5,00 | referência; caro para este volume |
| Anthropic | `claude-sonnet-5` | 2,00 | 0,20 | 10,00 | referência |

Os modelos Llama do Groq aparecem como "Contact Sales" na página de
modelos, por isso ficam fora do registro até terem preço público.

### 11.2 Registro inicial (`ai_model_config`)

| Capacidade | Primário | Fallback | Por quê |
|---|---|---|---|
| `route` (classificar intenção, só quando a regra não decide) | `gemini-2.5-flash-lite` | `openai/gpt-oss-20b` (Groq) | O mais barato de cada provedor; tarefa trivial |
| `extract` (texto/voz → slot estruturado) | `gemini-2.5-flash-lite` | `openai/gpt-oss-20b` (Groq) | Saída curta e estruturada |
| `followup` (pergunta de aprofundamento) | `gemini-2.5-flash-lite` | `openai/gpt-oss-20b` (Groq) | Uma frase |
| `converse` (copiloto com tools) | `gemini-3.5-flash-lite` | `openai/gpt-oss-120b` (Groq) | Já validado com tools no código atual; o fallback é mais barato e de outro provedor |
| `analyze` (análise final do diagnóstico) | `gemini-2.5-flash` | `gpt-5-mini` (OpenAI) | Melhor qualidade por um custo baixo; tem cache (o prompt fixo é grande) |
| `classify_batch` (tema de feedback, job diário) | `gemini-2.5-flash-lite` | — | Não é interativo |
| `stt` (Fase 3, se necessário) | `whisper-large-v3-turbo` (Groq) | `gpt-4o-mini-transcribe` | US$ 0,04/h |

Toda troca de modelo passa por evals (§7) antes de ativar em produção.

### 11.3 Estimativa de custo

| Unidade | Chamadas | Tokens (entrada / saída) | Custo estimado |
|---|---|---|---:|
| Diagnóstico completo | 4× `extract`, 2× `followup`, 1× `analyze` | ~10k / ~1,9k | **~US$ 0,006** |
| Turno do copiloto com tool | 2× `converse` | ~6k / ~0,35k | **~US$ 0,003–0,004** |
| Briefing ao abrir o chat | 0 | 0 | US$ 0 |
| Clique em chip | 0 | 0 | US$ 0 |

Com **US$ 10/mês**, isso dá cerca de 1.500 diagnósticos ou 2.500 turnos
do copiloto. O número real vem do painel (§5.4) no primeiro mês; revisar
a estimativa lá.

**Atenção ao tier gratuito:** Gemini e Groq têm tiers gratuitos, mas os
termos dos tiers gratuitos em geral permitem que o provedor use o conteúdo
para melhorar produtos. Como o diagnóstico tem dados pessoais e privados,
**a produção deve usar tier pago** (faturamento ativo). Conferir os termos
de cada provedor antes do lançamento e registrar em `ai-policy.md`.

---

## 12. Privacidade, retenção e transparência (LGPD)

> Sugestão técnica, não parecer jurídico. Antes de publicar os textos de
> privacidade e termos, vale uma revisão de um advogado com experiência em LGPD.

### 12.1 Prazos de retenção sugeridos

| Dado | Prazo | Motivo |
|---|---|---|
| Conversas do chat (`ai_messages`, `ai_threads`) | **12 meses após a última mensagem da conversa**; o usuário pode apagar a qualquer momento | Dá continuidade a um ciclo de mentoria (de vários meses) sem guardar além do necessário (LGPD art. 6º, III, e arts. 15–16) |
| Estado intermediário do diagnóstico (`diagnostic_sessions.state`) | **30 dias** após conclusão ou abandono | O resultado final fica em `quiz_responses`; as respostas brutas intermediárias não precisam ficar |
| Resultado do diagnóstico de usuário logado | Enquanto a conta existir; o usuário pode apagar | É o histórico dele e alimenta o copiloto |
| Quiz anônimo (eventos, com nome e e-mail) | **24 meses** ou até pedido de exclusão | É um lead; sem conta, não há outro gatilho de exclusão |
| Eventos de uso (`ai_usage_events`) | Sem conteúdo; `user_id` anonimizado após **24 meses** ou na exclusão da conta | Planejamento de custo não precisa identificar a pessoa depois disso |
| Feedback | Indefinido, anonimizado na exclusão da conta | Métrica de produto |
| Compartilhamentos com mentor | Enquanto ativos; histórico de revogação por 12 meses | Prestação de contas do consentimento |
| Traces de depuração (Langfuse, se usado) | **30 dias** | Só para depurar |
| Exclusão da conta | Apaga conversas, diagnósticos e compartilhamentos em cascata | Direito de eliminação (art. 18, VI) |

A aplicação é feita por um cron (`/api/cron/ai-retention`, mesmo padrão e
`CRON_SECRET` de `/api/cron/appointments`), que roda diariamente e registra
quantas linhas apagou.

### 12.2 Diagnóstico privado com compartilhamento opcional

- **Privado por padrão.** RLS em `quiz_responses` para linhas com `user_id`:
  só o dono lê. Linhas anônimas (`user_id is null`, quiz de eventos)
  continuam acessíveis pelo `id` (UUID não adivinhável) para a página de
  resultado. Validar isso na auditoria da Fase 0.
- **Compartilhamento:** tabela `diagnostic_shares (id, quiz_response_id,
  owner_id, mentor_id, scope, created_at, revoked_at)`.
  - `scope = 'summary'` (padrão): título, áreas, desafio e visão
    resumidos, próximos passos. **Não inclui** a resposta sobre vida pessoal.
  - `scope = 'full'`: inclui tudo, mediante escolha explícita.
- **RLS:** o dono faz tudo; o mentor lê só se houver share ativo
  (`revoked_at is null`) com ele. Nada de `service_role`.
- **Onde o usuário escolhe:** (1) checkbox desmarcado por padrão no
  agendamento ("Compartilhar meu diagnóstico com este mentor"); (2) no
  chat, com chip de confirmação; (3) em `/profile` → Mentoria, com a
  lista de compartilhamentos e o botão "Revogar".
- **O que o mentor vê:** no card da sessão, "Diagnóstico compartilhado" →
  visão só-leitura. Na Fase 3, a tool "preparar sessão" do copiloto do
  mentor usa esse conteúdo, e só ele.
- **Dado sensível:** a pergunta de vida pessoal pode trazer dados de saúde
  (LGPD art. 5º, II, e art. 11). O fluxo não pede detalhes de saúde. Se a
  resposta indicar sofrimento ou crise, o grafo interrompe o diagnóstico e
  mostra o CVV (188, cvv.org.br) em vez de seguir. Essa resposta também
  fica fora de jobs em lote e de traces.

### 12.3 Onde o usuário precisa ser informado

| Local | O que adicionar |
|---|---|
| `/privacy` (`app/[locale]/privacy/page.tsx` + `messages/*.json`) | Nova seção "Uso de inteligência artificial": dados tratados, finalidade, base legal (execução do serviço pedido; consentimento para compartilhar com mentor), provedores (Google, Groq, OpenAI) e transferência internacional (art. 33), tabela de retenção da §12.1, direitos (acesso, exclusão, revogação), revisão de decisão automatizada (art. 20: sugestões de mentor são recomendações e a escolha é do usuário) |
| `/terms` | Uso aceitável do assistente; diagnóstico gratuito 1× por mês (limite pode mudar); IA pode errar; não substitui orientação psicológica, jurídica ou médica; proibido automatizar ou abusar; suspensão em caso de abuso |
| `/faq` | "O que é o diagnóstico?", "Quem vê meu diagnóstico?", "Por que só 1 por mês?", "Como apago minhas conversas?" |
| No chat, primeiro uso | Aviso curto e único (IA, privacidade, link para `/privacy`), aceite gravado em `profiles.ai_disclosure_accepted_at` |
| No chat, sempre | Rodapé: "Respostas geradas por IA podem conter erros." |
| `/settings` ou `/profile` | "Meus dados de IA": apagar conversas, ver/revogar compartilhamentos, baixar meu diagnóstico |
| E-mail (Brevo) | Aviso de atualização da política de privacidade e dos termos para a base atual |
| `kb/politicas/uso-de-ia.md`, `kb/mentorados/diagnostico.md` | Mesmo conteúdo, para o copiloto responder perguntas sobre isso |
| `docs/governance/ai-policy.md` | Versão interna: provedores, tiers, prazos, quem acessa o quê |
| `public/llms.txt` | Uma linha sobre o diagnóstico e a política de IA |

A página `/cookies` não muda: nada disso usa cookie novo no navegador.
