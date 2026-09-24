---
title: "ADR 0002 — Estado do agente em tabelas próprias com RLS, não em checkpointer"
owner: paul
status: current
last_reviewed: 2026-09-24
source_of_truth: [app/api/assistant/route.ts, AGENTS.md]
---

# ADR 0002 — Estado em tabelas próprias, sem checkpointer do LangGraph

- **Status:** implementado (o assistente hoje já é stateless no servidor;
  o histórico vem do client a cada request). Decide também como a Fase 1
  (`diagnostic_sessions`) deve persistir estado.
- **Plano:** `AI_PLATFORM_PLAN.md` §2.3.

## Contexto

O LangGraph oferece um `checkpointer` (ex.: `PostgresSaver`) que grava o
estado do grafo automaticamente entre turnos. É a forma "padrão" de dar
memória a um agente LangGraph.

## Decisão

**Não usar `PostgresSaver`/checkpointer do LangGraph.** Motivo: ele conecta
no Postgres com uma role própria e **ignora Row Level Security** — viola a
invariante `AGENTS.md` "Security first — never bypass RLS" e o princípio 4
do plano ("permissão no servidor, não no prompt", que pressupõe que toda
leitura/escrita passa pelo cliente Supabase da sessão).

Em vez disso:

1. **O grafo é invocado sem estado no servidor a cada request.** A rota
   monta as mensagens passadas (`history` que o client já tem) e invoca
   `agent.streamEvents(...)` do zero. É o que `app/api/assistant/route.ts`
   já faz hoje.
2. **Estado de longo prazo vive em tabelas próprias, com RLS normal**
   (mesmo padrão de toda a base): `ai_threads`, `ai_messages`,
   `diagnostic_sessions.state jsonb` (Fase 1 — slots preenchidos, passo
   atual, contagem de follow-ups). A rota lê o estado, invoca o grafo,
   grava o novo estado — três passos explícitos, nenhum "mágico".
3. Um checkpointer só entra se aparecer um caso real de `interrupt()` longo
   que essas tabelas não cubram (ex.: uma pausa multi-turno complexa) — e
   nesse caso um novo ADR registra a exceção e como ela continua respeitando
   RLS (ex.: um `checkpointer` customizado que usa o cliente da sessão).

## Consequências

- Nenhuma tabela de estado de IA usa `service_role`; todas seguem o padrão
  de RLS documentado nas outras ADRs (`security definer` só para os RPCs
  que precisam agregar/validar, nunca para bypassar RLS de leitura comum).
- Histórico de conversa tem um teto (últimas N mensagens + resumo, plano
  §4.4) porque cresce por request, e não é comprimido automaticamente por
  um checkpointer.
- Reavaliar apenas com um ADR novo, não revertendo este.
