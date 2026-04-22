# 📓 JOURNAL - Registro de Decisões e Marcos

## 2026-04-22: Estabilização de Roteamento e Expansão de Perfis
- **Decisão:** Unificação do acesso ao dashboard via rota polimórfica `/dashboard`.
- **Racional:** Reduzir a confusão de navegação do usuário final e centralizar o redirecionamento baseado em roles (Admin, Mentor, Mentee) via servidor.
- **Marcos Técnicos:**
    - Correção do `router` para usar a instância localizada do `next-intl` (evitando quebras de rota em `/admin`).
    - Implementação de transição de estado de Mentor no Perfil (Solicitar/Sair).
    - Mural de Mentorados (Ex-Comunidade) agora filtra por `is_public` e tipo `mentee`.
    - Gestão de Organizações agora suporta upload de logo via Supabase Storage.
    - Criação do documento `ARCHITECTURE_EVOLUTION.md` prevendo migração para Monorepo.

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
