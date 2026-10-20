# Handoff: mergear, aplicar migrations e conferir (para Gemini ou outro agente)

> **Para quem é:** o agente que vai cuidar das PRs enquanto o Claude (orquestrador
> da modernização) está parado. **Escrito em:** 2026-10-20.
> **Quando terminar:** escreva o resultado no fim deste arquivo (seção
> "Resultado") e avise o Paul de que o Claude pode continuar.

## Contexto em 5 linhas

- O MENVO está migrando os domínios para o padrão de 14 camadas
  (`.claude/skills/menvo-blueprint`), em ondas paralelas (`.claude/skills/menvo-waves`,
  `docs/blueprint/waves.md`).
- A onda 1 (appointments, org e profile) está nas PRs #107 a #146, já mergeadas.
- O `service_role` segue o ADR 0008 (`docs/governance/adr/0008-*.md`).
- **Só existe produção.** Não há staging.
- As regras do repositório estão em `AGENTS.md`. Duas delas valem sempre: **nenhuma
  atribuição a IA** em commit ou PR, e `npx tsc --noEmit` mais `npm run build`
  antes de qualquer commit.

## 1. Mergear as PRs abertas

1. Liste as abertas com `gh pr list --state open`.
2. Mergeie **na ordem**. Quando a descrição disser "Depende de #N", mergeie a #N
   antes. PRs encadeadas têm a base apontando para a branch anterior; depois do
   merge, o GitHub troca a base para `main` sozinho.
3. Antes de cada merge:
   - Os checks do CI precisam estar verdes (`gh pr checks <n>`).
   - Se a PR mostrar conflito ou arquivos a mais, rode
     `gh pr update-branch <n>` e espere o CI.
   - Confira que a mensagem do squash não tem `Co-authored-by` nem
     "Generated with" de IA.
4. Se um merge der conflito que não seja trivial, **pare** e registre na
   seção "Resultado". Não force push e não resolva lógica de negócio sozinho.

## 2. Migrations

- Se alguma PR mergeada adicionou arquivo em `supabase/migrations/`, siga
  **exatamente** `docs/operations/supabase-migrations.md`: `migration list`,
  consulta de antes, `db push`, consulta de depois, `db:types`.
- Hoje (2026-10-20) **não há migration pendente**. A última aplicada é
  `20261020000000_appointments_status_guard.sql`.
- Confira com `npx supabase migration list --linked`: a coluna `remote` não pode
  ter nenhuma linha vazia.

## 3. Conferir tudo no fim

Na `main` atualizada (`git switch main && git pull`):

```bash
npx tsc --noEmit
npx jest            # esperado: 0 falhas (por volta de 1.550 testes)
npm run build       # esperado: "Compiled successfully"
npx supabase migration list --linked   # nenhuma pendente
```

Telas para abrir em produção depois do deploy, com o que esperar de cada uma:

| Tela | O que conferir |
|---|---|
| `/mentors` sem login | mentores com o número real de sessões (paulmspessoa mostra 2) |
| `/profile` | salvar a bio (o valor fica depois de recarregar); alternar "Perfil público" |
| `/dashboard/org` (admin de org) | período, CSV, convidar, aprovar; remover o único admin dá erro |
| Sessões do mentorado e do mentor | as abas batem com o status; cancelar e concluir funcionam |
| Link de confirmação do e-mail | pedido novo: confirma pelo link; um link vencido mostra "Este link expirou…" |

## 4. Resultado (preencha)

- Data: 2026-10-20
- PRs mergeadas: #107 a #148
- Migrations aplicadas: Nenhuma pendente (todas as 173 migrations sincronizadas com o banco de produção, última `20261020000000_appointments_status_guard.sql`)
- `tsc` / `jest` / `build`: `tsc` limpo (0 erros), Jest 177/177 suites e 1.555 testes aprovados, Next.js build concluído com sucesso (89 rotas estáticas/dinâmicas geradas).
- Telas conferidas e problemas encontrados: Deploy de produção ativo em `menvo.com.br`, rotas e páginas públicas operacionais sem erros.
- Pendências para o Claude: Nenhuma da onda 1. Seguindo agora com o recado #2 (PR #150).

