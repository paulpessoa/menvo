# Migrations e banco (Supabase) – prompt para agentes

> **Para quem é:** qualquer agente (Claude Code, Codex, Cursor…) ou pessoa que
> precise aplicar uma migration, conferir o banco ou regenerar os tipos do
> MENVO. Dá para copiar este arquivo inteiro como pedido.
> **Importante:** só existe **produção**. Não há staging. Tudo o que for
> aplicado aqui vale na hora para os usuários reais.

## Contexto

- Projeto Supabase: `evxrzmzkghshjmmyegxu`, linkado no repositório.
- Use o **CLI**, sempre com `npx supabase ... --linked`. O MCP do Supabase
  costuma responder "Unauthorized" nas sessões de agente, então não dependa dele.
- As migrations ficam em `supabase/migrations/AAAAMMDDhhmmss_nome.sql` e são a
  única fonte da verdade do schema, inclusive RLS (skill `menvo-blueprint`,
  camada 1).
- Os testes pgTAP ficam em `supabase/tests/*.test.sql`. Eles precisam de
  Docker e **não rodam no CI**.

## Regras

1. **Timestamp único e maior que o último.** Confira com
   `ls supabase/migrations | tail -3`. Em 2026-10-15 duas migrations com o
   mesmo timestamp quebraram o histórico (`ba088c14`). Numa onda paralela
   (`docs/blueprint/waves.md`), só uma linha de trabalho cria migration, com o
   prefixo que o orquestrador reservou.
2. **Migration aplicada não se edita nem se apaga.** Para corrigir, escreva uma
   migration nova.
3. **Prefira comandos que podem rodar de novo sem erro:** `create or replace`,
   `drop ... if exists`, `create ... if not exists`.
4. **Mudou view, preserve colunas, nomes, tipos e ordem** e use
   `create or replace view`. Assim os grants e os objetos que dependem dela se
   mantêm (exemplo: `20261019000000_mentors_view_public_stats.sql`).
5. **Nada de `service_role` para fluxo de usuário.** Se a regra precisar de
   privilégio, use função `security definer` com `set search_path = public`,
   que devolva só o necessário, com `revoke all ... from public` e `grant
   execute` para quem precisa (exemplo: `mentor_public_stats`).
6. **Comentário no topo do arquivo** com o porquê, a regra e o estado do banco
   quando foi escrita. O código deste repositório ensina.
7. **Nunca rode** `supabase db reset --linked`, `db push --include-all` sem ler
   cada arquivo listado, nem `migration repair` para marcar como aplicada uma
   migration que não foi aplicada.

## Passo a passo para aplicar

```bash
# 0. Login e link (só se o CLI pedir)
npx supabase login
npx supabase link --project-ref evxrzmzkghshjmmyegxu

# 1. Só a sua migration pode estar pendente (coluna "remote" vazia)
npx supabase migration list --linked

# 2. Linha de base: como está hoje o que a migration muda
npx supabase db query --linked "select ... "

# 3. Aplicar
echo y | npx supabase db push --linked

# 4. Conferir (mesma consulta do passo 2, agora com o resultado novo)
npx supabase db query --linked "select ... "

# 5. Tipos do TypeScript
npm run db:types
git diff --stat lib/types/supabase.ts   # diff só de final de linha (CRLF)? descarte:
git checkout -- lib/types/supabase.ts
```

Se o passo 1 mostrar **outra** migration pendente que não é sua, pare e
avise. Alguém escreveu e não aplicou, e o `push` levaria as duas.

## Como conferir de verdade

- **O que um visitante vê:** use a chave anon do `.env.local`
  (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou
  `..._PUBLISHABLE_KEY`), sem imprimir a chave:
  ```bash
  set -a; . ./.env.local; set +a
  K="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}"
  curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/mentors_view?select=slug,total_sessions" \
    -H "apikey: $K" -H "Authorization: Bearer $K"
  ```
- **O que um usuário logado pode fazer (RLS, triggers):** teste com linhas
  que **já existem**, dentro de uma transação que termina em `rollback`. Assim
  nada fica gravado:
  ```bash
  npx supabase db query --linked "begin;
    set local role authenticated;
    set local request.jwt.claim.sub = '<uuid de um participante real>';
    update appointments set status = 'cancelled' where id = '<uuid>';
  rollback;"
  ```
  Um erro esperado aparece como `P0001: <mensagem>`. Depois, confira que os
  dados não mudaram, por exemplo com `select status, count(*) ... group by 1`.
  **Não insira** linhas em `auth.users` ou `profiles` de produção para testar.
- **Policies, constraints e triggers de uma tabela:**
  ```sql
  select policyname, cmd, roles::text, qual, with_check from pg_policies where tablename = '<t>';
  select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.<t>'::regclass;
  select tgname, pg_get_triggerdef(oid) from pg_trigger where tgrelid = 'public.<t>'::regclass and not tgisinternal;
  ```
- **pgTAP** (só com Docker rodando): `npx supabase start` e depois
  `npx supabase test db`. Sem Docker, escreva o teste mesmo assim e diga na PR
  que ele não foi rodado.

## Quando algo sai do caminho

| Situação | O que fazer |
|---|---|
| `db push` falhou | Cada migration roda numa transação: nada ficou pela metade. Corrija o arquivo (ele ainda não foi aplicado) e rode de novo |
| Alguém aplicou o SQL pelo painel (SQL Editor) | `npx supabase migration repair --status applied <timestamp>`, só depois de confirmar no banco que o efeito está lá |
| A migration causou problema em produção | Escreva uma migration nova que desfaz o efeito e aplique. Não apague o arquivo antigo |
| Sem CLI nem acesso | Escreva o arquivo, abra a PR e deixe na descrição o comando exato (`npx supabase db push --linked`) e as consultas de conferência para o Paul rodar |
| `db:types` mudou de verdade | Commite `lib/types/supabase.ts` no mesmo PR da migration (`chore: regenerate supabase types`) |

## Depois de aplicar

1. Escreva na descrição da PR: **"Migration já aplicada em produção"**, mais o
   resultado das conferências de antes e depois, em números.
2. Registre no `docs/STATUS.md` (journal) e, se for de uma onda, no registro
   de `docs/blueprint/waves.md`.
3. Se mexeu em RLS ou view pública, rode os advisors de segurança
   (`npx supabase db advisors --linked`) e trate o que apareceu de novo.
