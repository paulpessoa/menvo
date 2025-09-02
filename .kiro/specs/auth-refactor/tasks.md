# Implementation Plan

- [x] 1. Preparar ambiente e fazer backup






  - Fazer backup completo dos dados do Supabase usando CLI
  - Configurar Supabase local para desenvolvimento
  - Testar restauração dos dados de usuários no ambiente local
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Limpar e reorganizar banco de dados





- [x] 2.1 Remover estruturas obsoletas do Supabase


  - Identificar e remover tabelas customizadas desnecessárias
  - Remover functions obsoletas mantendo apenas as essenciais
  - Remover triggers desnecessários
  - Remover policies obsoletas
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 2.2 Criar nova estrutura simplificada do banco


  - Criar tabela profiles com campos essenciais e campo verified boolean
  - Criar tabela roles com apenas mentor, mentee, admin
  - Criar tabela user_roles para relacionamento usuário-papel
  - Criar tabela mentor_availability para disponibilidade dos mentores
  - Criar tabela appointments para agendamentos básicos
  - Configurar storage bucket para avatars
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 2.3 Implementar triggers e functions essenciais


  - Criar trigger para criação automática de perfil ao cadastrar usuário
  - Criar function para geração de slug único para username
  - Implementar custom claims function para incluir roles e verified no JWT
  - Criar function para atualização de campos de auditoria
  - Configurar cascade delete para limpeza de dados relacionados
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 2.4 Configurar Row Level Security (RLS)


  - Implementar policies para profiles (próprio perfil + mentores verificados públicos)
  - Implementar policies para user_roles (apenas próprias roles)
  - Implementar policies para mentor_availability e appointments
  - Testar todas as policies com diferentes tipos de usuário
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 3. Consolidar arquivos de autenticação do frontend





- [x] 3.1 Criar auth context consolidado


  - Implementar AuthContext único com interface completa
  - Incluir métodos para signIn, signUp, signInWithProvider, signOut, selectRole
  - Implementar lógica de refresh de perfil e verificação de role
  - Adicionar tratamento de erros específicos do Supabase
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3.2 Implementar hook de autenticação único


  - Criar useAuth hook que consome o AuthContext
  - Implementar lógica de loading states e error handling
  - Adicionar helpers para verificação de roles e status
  - Testar hook com diferentes cenários de autenticação
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3.3 Criar componente AuthGuard consolidado


  - Implementar AuthGuard com props para requireRole, allowedRoles, requireVerified
  - Adicionar lógica de redirecionamento baseada no estado do usuário
  - Implementar loading states durante verificação de autenticação
  - Testar proteção de rotas com diferentes cenários
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3.4 Remover arquivos duplicados de autenticação







  - Identificar e remover arquivos duplicados (useAuth, auth-context, AuthGuard extras)
  - Atualizar imports em todos os componentes que usavam arquivos removidos
  - Verificar se não há referências quebradas após remoção
  - Testar aplicação após limpeza dos arquivos
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Implementar fluxo de cadastro e login








- [x] 4.1 Criar componentes de cadastro


  - Implementar formulário de cadastro com email/senha
  - Adicionar botões de cadastro com Google e LinkedIn
  - Implementar validação de formulário e tratamento de erros
  - Adicionar feedback visual para estados de loading
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4.2 Criar componentes de login

  - Implementar formulário de login com email/senha
  - Adicionar botões de login com Google e LinkedIn
  - Implementar tratamento de erro para email não confirmado
  - Adicionar links para recuperação de senha e cadastro
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4.3 Implementar páginas de callback para emails do Supabase


  - Criar página callback.tsx para processar todos os tipos de email
  - Implementar tratamento para confirmation, recovery, invite, magic_link, email_change
  - Adicionar redirecionamentos apropriados para cada tipo de callback
  - Implementar tratamento de erros para tokens expirados ou inválidos
  - _Requirements: 4.4, 5.4_

- [x] 4.4 Criar páginas auxiliares de autenticação





  - Implementar página confirm-email.tsx para aguardar confirmação
  - Criar página reset-password.tsx para definir nova senha
  - Implementar página set-password.tsx para senha inicial após convite
  - Adicionar opções de reenvio de email quando necessário
  - _Requirements: 4.4, 5.4_

- [x] 5. Implementar seleção obrigatória de papel





- [x] 5.1 Criar página de seleção de papel


  - Implementar interface para escolha entre mentor e mentee
  - Adicionar descrições claras de cada papel
  - Implementar validação para garantir seleção obrigatória
  - Adicionar feedback visual durante processo de seleção
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_


- [x] 5.2 Implementar lógica de redirecionamento baseada em papel

  - Adicionar verificação de papel no AuthGuard
  - Implementar redirecionamento automático para seleção quando papel é null
  - Criar lógica para redirecionar para dashboard apropriado após seleção
  - Testar fluxo completo de cadastro → confirmação → seleção → dashboard
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6. Implementar sistema de verificação de mentores



- [x] 6.1 Criar dashboard administrativo para verificação


  - Implementar lista de mentores não verificados para admins
  - Adicionar interface para marcar mentores como verificados
  - Implementar filtros e busca na lista de mentores
  - Adicionar proteção de acesso apenas para admins
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 6.2 Implementar lógica de verificação no backend




  - Criar endpoint API para verificação de mentores (mantém ROLE_KEY)
  - Implementar validação de permissões de admin
  - Adicionar atualização do campo verified na tabela profiles
  - Implementar logs de auditoria para verificações
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 7. Criar listagem pública de mentores
- [x] 7.1 Implementar página de mentores públicos




  - Criar página que lista apenas mentores verificados
  - Implementar cards de mentor com informações básicas
  - Adicionar filtros por especialidade ou disponibilidade
  - Implementar busca por nome ou especialidade
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 7.2 Criar página individual do mentor


  - Implementar página detalhada de cada mentor usando slug
  - Mostrar perfil completo, especialidades e disponibilidade
  - Adicionar botão para solicitar agendamento
  - Implementar breadcrumbs e navegação
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 8. Implementar sistema básico de disponibilidade
- [x] 8.1 Criar formulário de disponibilidade para mentores


  - Implementar interface para definir dias da semana disponíveis
  - Adicionar seleção de horários por dia
  - Implementar validação de horários (início < fim)
  - Adicionar preview da disponibilidade configurada
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 8.2 Implementar visualização de disponibilidade



  - Criar componente para mostrar disponibilidade na página do mentor
  - Implementar formatação amigável de dias e horários
  - Adicionar indicadores visuais para horários ocupados
  - Integrar com sistema de agendamentos
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 9. Implementar agendamento básico com Google Calendar





- [x] 9.1 Configurar integração com Google Calendar API


  - Configurar credenciais do Google Calendar no ambiente
  - Implementar autenticação OAuth para Google Calendar
  - Criar funções helper para operações do Calendar
  - Testar criação de eventos básicos
  - _Requirements: 11.5_

- [x] 9.2 Implementar fluxo de agendamento


  - Criar interface para mentee solicitar agendamento
  - Implementar verificação de disponibilidade do mentor
  - Criar registro na tabela appointments
  - Implementar criação automática de evento no Google Calendar com Meet link
  - _Requirements: 11.4, 11.5_

- [ ] 10. Limpar e otimizar endpoints da API
- [ ] 10.1 Auditar endpoints existentes do Next.js
  - Identificar endpoints que usam ROLE_KEY e devem ser mantidos
  - Listar endpoints duplicados ou desnecessários
  - Identificar endpoints que podem migrar para client-side do Supabase
  - Documentar decisões de manter ou remover cada endpoint
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 10.2 Remover endpoints desnecessários
  - Remover endpoints duplicados de autenticação
  - Migrar endpoints simples para client-side do Supabase quando possível
  - Manter apenas endpoints que realmente precisam ser server-side
  - Atualizar componentes que usavam endpoints removidos
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 11. Implementar dashboards específicos por papel
- [ ] 11.1 Criar dashboard do mentor
  - Implementar dashboard com estatísticas básicas do mentor
  - Mostrar status de verificação e próximos agendamentos
  - Adicionar links para configurar disponibilidade e perfil
  - Implementar seção de agendamentos pendentes e confirmados
  - _Requirements: 6.5, 9.4, 11.1_

- [ ] 11.2 Criar dashboard do mentee
  - Implementar dashboard com agendamentos do mentee
  - Adicionar seção de mentores favoritos ou recentes
  - Mostrar histórico de mentorias
  - Adicionar link para buscar novos mentores
  - _Requirements: 6.5, 10.5_

- [ ] 11.3 Criar dashboard administrativo
  - Implementar dashboard com estatísticas da plataforma
  - Adicionar seção de mentores pendentes de verificação
  - Mostrar métricas de usuários e agendamentos
  - Implementar ferramentas de moderação básicas
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 12. Testes e validação final
- [ ] 12.1 Implementar testes unitários críticos
  - Criar testes para auth context e hooks
  - Implementar testes para AuthGuard com diferentes cenários
  - Testar validações de formulários de auth
  - Criar testes para funções helper de agendamento
  - _Requirements: 3.5, 6.5_

- [ ] 12.2 Realizar testes de integração
  - Testar fluxo completo de cadastro → confirmação → seleção → dashboard
  - Validar login com diferentes providers (email, Google, LinkedIn)
  - Testar fluxo de verificação de mentor
  - Validar agendamento e criação de evento no Google Calendar
  - _Requirements: 4.5, 5.5, 6.5, 9.5, 11.5_

- [ ] 12.3 Validar preservação do layout existente
  - Verificar se todos os componentes visuais foram preservados
  - Testar responsividade em diferentes dispositivos
  - Validar que apenas campos desnecessários foram removidos
  - Confirmar que a experiência do usuário permanece consistente
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 13. Deploy e monitoramento
- [ ] 13.1 Preparar deploy para produção
  - Gerar migrações finais comparando local com produção
  - Revisar todas as migrações antes do deploy
  - Fazer backup final do ambiente de produção
  - Configurar variáveis de ambiente de produção
  - _Requirements: 1.5_

- [ ] 13.2 Executar deploy gradual
  - Aplicar migrações do banco em produção
  - Fazer deploy do frontend via Vercel
  - Monitorar logs de erro durante as primeiras horas
  - Validar que usuários existentes conseguem fazer login
  - _Requirements: 1.5, 2.1_

- [ ] 13.3 Validação pós-deploy
  - Testar todos os fluxos críticos em produção
  - Verificar se não há erros no console do Supabase
  - Confirmar que performance foi mantida ou melhorada
  - Validar que todos os emails do Supabase funcionam corretamente
  - _Requirements: 4.4, 5.4, 13.5_