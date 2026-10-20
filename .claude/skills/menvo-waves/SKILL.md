---
name: menvo-waves
description: Orquestra o blueprint de 14 camadas em vários domínios ao mesmo tempo, com subagentes em paralelo (um domínio por agente, cada um no próprio worktree) sem conflito entre eles, e escolhe o modelo de cada etapa para gastar menos tokens. Use quando o pedido for "rodar a onda N", "paralelizar domínios", "abrir agentes para os módulos X e Y", "continuar a modernização em paralelo" ou "integrar as branches da onda". Para um domínio só, use a skill menvo-blueprint direto.
---

# MENVO Waves

Esta skill não define o padrão das camadas; isso é a `menvo-blueprint`. Ela
define **como vários agentes aplicam esse padrão ao mesmo tempo** sem pisar um
no outro, e quem faz o quê.

O plano das ondas e o registro do que já entrou estão em
`docs/blueprint/waves.md`. Leia antes de começar.

## Papéis

| Papel | Quem | Modelo | Faz |
|---|---|---|---|
| Orquestrador | a sessão principal | Opus (esforço high basta) | Escolhe as linhas da onda, revisa auditorias e planos, decide os pontos de parada com o Paul, escreve SQL/RLS/ADR, edita os arquivos compartilhados, integra e abre os PRs |
| Agente de linha | `Agent` com `isolation: "worktree"` | `model: "sonnet"` | Roda `modo audit` + `modo plan` e depois `modo apply` de **um** domínio, só nos arquivos desse domínio |

O Opus não implementa camada que já está planejada: isso é trabalho de
Sonnet. O Sonnet não decide `service_role`, RLS nem formato de resposta: para
e devolve a pergunta.

## Regras contra conflito

1. **Um domínio por agente, no máximo 3 agentes por vez.** O repositório está
   no OneDrive e cada worktree tem build e testes próprios; acima de 3 a
   máquina vira o gargalo.
2. **Posse de arquivos.** O agente só cria ou edita arquivos do próprio
   domínio:
   `app/api/<d>/**`, `app/[locale]/<rotas do d>/**`, `components/<d>/**`,
   `hooks/<d>/**`, `lib/domain/<d>/**`, `lib/schemas/<d>*.ts`,
   `lib/repositories/<d>*.ts`, `lib/services/<d>/**`,
   `lib/ports/<d>-*.ts` e `lib/ports/adapters/<d>-*`,
   `lib/query/keys/<d>.ts`, `lib/query/effects/<d>.ts`,
   `lib/openapi/paths/<d>.ts`, `lib/agents/capabilities/<d>*`,
   `docs/blueprint/<d>-audit.md`, `supabase/tests/<d>*.test.sql`.
   Se precisar mudar um arquivo de outro domínio, para e descreve a mudança
   no relatório.
3. **Arquivos compartilhados são só do orquestrador, e só na integração.**
   O agente não edita, nem que o teste de drift ou o typecheck "precise":
   `lib/query/keys.ts`, `lib/query/effects.ts`, `lib/query/http.ts`,
   `lib/openapi/document.ts`, `lib/openapi/document.test.ts`,
   `lib/agents/exposure.ts`, `lib/agents/registry.ts`, `messages/*.json`,
   `docs/STATUS.md`, `docs/blueprint/waves.md`, `lib/types/supabase.ts`,
   `package.json`, `package-lock.json`, `.github/**`, `eslint.config.mjs`,
   `AGENTS.md`, `.claude/**`. Ele lista no relatório, em "Pedidos para
   arquivos compartilhados", a linha exata que precisa entrar (o import em
   `keys.ts`, as chaves de i18n com o texto em pt-BR, en e es, a entrada do
   STATUS).
4. **Migration: só uma linha por onda.** A linha que tem a migration recebe um
   prefixo de timestamp reservado no prompt (ex.: `20261020`); as outras não
   criam migration. Em 2026-10-15 duas migrations com o mesmo timestamp
   quebraram o histórico (`ba088c14`). Agente de linha nunca roda
   `supabase db push`. O orquestrador aplica em produção (o Paul autorizou em
   2026-10-19): `npx supabase migration list --linked` para conferir que só a
   nova está pendente, `db push --linked`, uma consulta com a chave anon antes
   e depois, e `npm run db:types`.
5. **Dependência nova, mudança de formato de resposta, `service_role` e apagar
   arquivo** continuam sendo pontos de parada (ver `menvo-blueprint`). O agente
   para, não contorna.

## Fluxo de uma onda

0. **Limite (Paul).** Só comece uma onda com **pelo menos 40% do limite
   semanal livre**. O orquestrador não enxerga esse número: pergunte ao Paul.
   Se ele avisar que passou de **90%** no meio da onda, mande todos os agentes
   commitarem WIP na própria branch (`wip(<d>): ...`) e pararem.
1. **Briefing (orquestrador, antes de abrir agentes).** Escreva
   `docs/blueprint/<d>-brief.md` para cada linha: escopo, arquivos de partida,
   fatos do banco que o orquestrador já consultou, decisões já tomadas, o que
   é proibido nesta linha. O agente lê o briefing em vez de explorar o
   repositório para descobrir isso sozinho.
2. **Auditar e planejar (Sonnet, em paralelo).** Um agente por linha, prompt
   da seção abaixo, fase `audit+plan`. Todos na mesma mensagem.
3. **Checkpoint depois do plano (Opus + Paul).** Leia cada
   `docs/blueprint/<d>-audit.md`, corrija o plano, junte as decisões do Paul
   numa pergunta só e espere a resposta. Nenhum código antes disso.
4. **Aplicar: uma sessão por grupo de camadas, com handoff (Sonnet).** Cada
   grupo de camadas do plano (ex.: 3-4, 5-8, 9, 10-11) é **uma sessão nova** de
   agente, não a mesma conversa crescendo. Ao fim do grupo o agente commita e
   escreve o handoff na seção "Handoff" do próprio audit (o que fez, o que
   ficou, arquivos compartilhados pendentes, em até 10 linhas). A sessão
   seguinte começa lendo só o briefing, o plano e o handoff. Teste por agente:
   só `npx tsc --noEmit` e o jest do próprio domínio. Nada de `npm run verify`
   completo nem build.
5. **Integrar (Opus), uma vez por lote.**
   - Revise o diff de cada branch: regras do AGENTS.md, RLS, Zod nas
     fronteiras, nenhuma atribuição a IA nos commits.
   - Aplique de uma vez os pedidos para arquivos compartilhados de todas as
     linhas (keys, effects, http, OpenAPI, STATUS), num commit
     `chore: integra arquivos compartilhados da onda N`. Linhas que tocam os
     mesmos compartilhados vão encadeadas, uma em cima da outra, para o
     conflito ser resolvido aqui e não no merge do Paul.
   - Rode `npm run build` e o jest completo **uma vez**, na ponta da pilha
     integrada, não por agente nem por branch.
   - Abra PRs pequenas (um grupo de camadas por PR), encadeadas pela base,
     para o Paul revisar e mergear pelo celular. Depois de cada merge,
     `git merge origin/main` na próxima (ou o botão "Update branch").
6. **Limpar worktrees com cuidado.** O `node_modules` de cada worktree é um
   junction para o do repositório principal, e `git worktree remove` segue o
   junction e **apaga o `node_modules` principal** (aconteceu em 2026-10-20,
   resolvido com `npm ci`). Antes de remover um worktree, desfaça o junction
   pela ferramenta PowerShell:
   `(Get-Item "<worktree>\node_modules").Delete()` (apaga só o link). Só
   depois rode `git worktree remove "<worktree>"`.
7. **Registrar.** Atualize `docs/blueprint/waves.md` (registro) e
   `docs/STATUS.md` (journal) e diga ao Paul qual modelo usar na próxima etapa.

## Prompt do agente de linha

Preencha os campos `<…>` e mande como `prompt` do `Agent`, com
`isolation: "worktree"`, `model: "sonnet"` e `description` "Blueprint <d>".

```text
Você é o agente da linha <domínio> na onda <N> da modernização do MENVO.
Fase: <audit+plan | apply grupos X-Y>.

Antes de tudo:
0. `git fetch origin && git reset --hard origin/main` (ou a ponta da pilha
   indicada no briefing). O worktree pode nascer num commit antigo: em
   2026-10-20 três agentes começaram sem o código da onda anterior.
1. Leia AGENTS.md, .claude/skills/menvo-blueprint/SKILL.md (e as references
   dele), .claude/skills/menvo-waves/SKILL.md (seção "Regras contra conflito")
   e docs/blueprint/quiz-audit.md como exemplo de auditoria e plano.
2. Seu worktree não tem node_modules. Na raiz do worktree, pela ferramenta
   PowerShell (o `cmd //c mklink` é bloqueado no worktree):
   New-Item -ItemType Junction -Path node_modules -Target "<raiz do repo principal>\node_modules"
   (você não pode mudar package.json, então as dependências são as mesmas).

Escopo: domínio <domínio>. Arquivos de partida: <lista de rotas, services,
páginas>. Você só edita os arquivos do domínio (regra 2). Arquivos
compartilhados (regra 3) entram no relatório, não no código.
Migration: <"proibida nesta linha" | "permitida, com prefixo 2026MMDD">.

Na fase audit+plan: escreva docs/blueprint/<domínio>-audit.md no formato do
quiz e pare. Não escreva código.
Leia primeiro docs/blueprint/<domínio>-brief.md (e, na fase apply, o plano e
o Handoff do audit). Não explore o repositório além do que o grupo pede.

Na fase apply: só o grupo <X-Y>. Um commit (Conventional Commits, sem
nenhuma linha de atribuição a IA), testes no mesmo commit. Rode só
`npx tsc --noEmit` e o jest do seu domínio. Não rode verify completo,
build nem e2e. Ao terminar, escreva a seção "Handoff" do audit (até 10
linhas) e pare.

Pare e pergunte (não contorne) em: migration fora da permissão acima,
dependência nova, mudança de formato de resposta, service_role, apagar
arquivo que você não criou.

Responda em NO MÁXIMO 15 linhas:
- Commits (hash + título) e camadas feitas.
- Pendências e decisões para o Paul (cada uma com sua sugestão).
- Pedidos para arquivos compartilhados (arquivo → linha exata).
- Resultado de tsc e do jest do domínio.
```

## Tokens

- Subagentes sempre em Sonnet (`model: "sonnet"`). O Opus orquestra, revisa,
  escreve SQL/RLS/ADR e integra.
- O orquestrador não lê o domínio inteiro: escreve o briefing com o que já
  sabe, lê a auditoria e o diff. Quem lê os arquivos é o Sonnet.
- Uma sessão por grupo de camadas, com handoff escrito. Uma conversa de agente
  que atravessa vários grupos fica cara, porque cada rodada relê todo o
  histórico.
- Resumo de retorno com no máximo 15 linhas. Detalhe vai no audit e nos
  commits, não na mensagem.
- Build e jest completo só uma vez por lote, na integração.
- Domínio pequeno (até 3 rotas, sem `service_role`) não precisa de auditoria
  separada: `audit+plan+apply` numa sessão só, e o orquestrador revisa o diff.
- Não use esforço max para orquestrar: high basta. Max só para revisão de
  SQL/RLS sensível.
