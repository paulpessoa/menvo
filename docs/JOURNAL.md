# 📓 JOURNAL - Registro de Decisões e Marcos

## 2026-03-30: Inicialização e Otimização de Agente
- **Decisão:** Atualização do modelo base no `.geminirc` de `1.5-pro` para `2.0-flash`.
- **Racional:** Melhorar a latência de resposta e a eficiência em tarefas de "Vibe Coding" e pequenas correções iterativas, mantendo a inteligência necessária para o contexto do projeto.
- **Ação:** Criação dos arquivos `HEARTBEAT.md` e `JOURNAL.md` para conformidade com o padrão SSoT definido no `GEMINI.md`.

## 2026-03-30: Gestão Global e Correções Críticas
- **Painel Admin:** Evolução da página `/admin/users` para um dashboard global. Inclui agora métricas de distribuição de roles, tendência de cadastros e engajamento de mentorias usando `recharts`.
- **Controle de Mentores:** Adicionada funcionalidade de aprovar/revogar mentores diretamente no painel global.
- **Chat RLS:** Identificado que policies antigas estavam conflitando. Criada migração `20260330000002_fix_chat_rls_final.sql` que limpa e redefine permissões granulares para conversas e mensagens.
- **Internacionalização:** Adicionados arquivos de tradução para Dinamarquês (`da`), Francês (`fr`) e Sueco (`sv`). Estrutura `next-intl` validada e em produção.
- **Status:** **Fase 1 e 2 concluídas**. Site estável e pronto para escala europeia.
