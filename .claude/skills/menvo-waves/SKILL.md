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
3. **Arquivos compartilhados são só do orquestrador.** O agente não edita:
   `lib/query/keys.ts`, `lib/query/effects.ts`, `lib/openapi/document.ts`,
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

1. **Preparar (orquestrador).** `git fetch origin main`, `main` atualizado,
   `npx tsc --noEmit` limpo. Escolha as linhas em `docs/blueprint/waves.md` e
   confira que nenhuma depende de outra da mesma onda.
2. **Auditar em paralelo (Sonnet).** Abra um agente por linha com o prompt da
   seção abaixo, fase `audit+plan`. Todos na mesma mensagem, para rodarem
   juntos.
3. **Revisar (Opus).** Leia cada `docs/blueprint/<d>-audit.md`. Corrija o plano
   onde ele erra, junte as decisões que são do Paul numa pergunta só e espere
   a resposta.
4. **Aplicar em paralelo (Sonnet).** Continue cada agente com `SendMessage`
   (mantém o contexto da auditoria), fase `apply`, com as decisões do Paul.
   Um commit por grupo de camadas, na branch do worktree.
5. **Integrar (Opus), uma linha por vez.**
   - Revise o diff da branch (`git diff main...<branch>`): regras do AGENTS.md,
     RLS, Zod nas fronteiras, nenhuma atribuição a IA nos commits.
   - Aplique os "Pedidos para arquivos compartilhados" na própria branch, num
     commit `chore(<d>): integra arquivos compartilhados`.
   - `npm run verify`, `npm run build`, e `npx jest lib/openapi` se o domínio
     ganhou contrato.
   - Abra o PR da linha. PRs pequenas: um grupo de camadas por PR, para o
     Paul conseguir revisar e mergear pelo celular. Depois do merge, a próxima branch faz
     `git merge origin/main` antes de seguir. Conflito só pode aparecer nos
     arquivos compartilhados, e quem resolve é o orquestrador.
6. **Registrar.** Atualize `docs/blueprint/waves.md` (registro) e
   `docs/STATUS.md` (journal) e diga ao Paul qual modelo usar na próxima etapa.

## Prompt do agente de linha

Preencha os campos `<…>` e mande como `prompt` do `Agent`, com
`isolation: "worktree"`, `model: "sonnet"` e `description` "Blueprint <d>".

```text
Você é o agente da linha <domínio> na onda <N> da modernização do MENVO.
Fase: <audit+plan | apply grupos X-Y>.

Antes de tudo:
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
Na fase apply: siga o plano aprovado, um commit por grupo (Conventional
Commits, sem nenhuma linha de atribuição a IA), testes no mesmo commit, e
rode `npm run verify` antes de cada commit. Não rode build nem e2e: isso
é do orquestrador.

Pare e pergunte (não contorne) em: migration fora da permissão acima,
dependência nova, mudança de formato de resposta, service_role, apagar
arquivo que você não criou.

Termine com:
- O que mudou, por camada (arquivo → uma linha).
- Decisões pendentes para o Paul (no máximo 3, cada uma com sua sugestão).
- Pedidos para arquivos compartilhados (arquivo → linha exata).
- Resultado do `npm run verify`.
- Nome da branch e lista de commits.
```

## Tokens

- O orquestrador não lê o domínio inteiro: lê a auditoria e o diff. Quem lê
  os arquivos é o Sonnet.
- Continue o mesmo agente com `SendMessage` entre audit e apply, em vez de
  abrir outro: o contexto já está carregado.
- Domínio pequeno (até 3 rotas, sem `service_role`) não precisa de auditoria
  separada: fase `audit+plan+apply` direto, e o orquestrador revisa só o diff.
- Não use esforço max para orquestrar: high basta. Max fica para revisão de
  SQL/RLS sensível.
