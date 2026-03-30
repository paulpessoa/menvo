# 📓 JOURNAL - Registro de Decisões e Marcos

## 2026-03-30: Inicialização e Otimização de Agente
- **Decisão:** Atualização do modelo base no `.geminirc` de `1.5-pro` para `2.0-flash`.
- **Racional:** Melhorar a latência de resposta e a eficiência em tarefas de "Vibe Coding" e pequenas correções iterativas, mantendo a inteligência necessária para o contexto do projeto.
- **Ação:** Criação dos arquivos `HEARTBEAT.md` e `JOURNAL.md` para conformidade com o padrão SSoT definido no `GEMINI.md`.

## 2026-03-30: Correção da Listagem de Mentores (P0)
- **Problema:** View `mentors_view` vazia para usuários anônimos.
- **Causa:** RLS restritivo nas tabelas `public.roles` e `public.user_roles` impedindo o join necessário para a view.
- **Solução:** Criada migração `20260330000001_fix_mentors_list_public_access.sql` concedendo permissão de SELECT para `anon` nestas tabelas.
- **Desafio:** Erro de histórico (Drift) no Supabase CLI. Resolvido com `migration repair` e sincronização via `db push`.
- **Status:** **Resolvido**. 4 mentores listados com sucesso.
