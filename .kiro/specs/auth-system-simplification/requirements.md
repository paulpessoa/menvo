# Requirements Document

## Introduction

O sistema de autenticação atual do Menvo está excessivamente complexo para um MVP com apenas 3 tipos de usuários (mentor, mentee, admin). Existem múltiplas implementações conflitantes, hooks duplicados, contextos sobrepostos e lógicas redundantes que estão causando confusão e bugs. Este projeto visa simplificar drasticamente o sistema de autenticação para ser funcional, confiável e fácil de manter para a apresentação na Campus Party.

## Requirements

### Requirement 1

**User Story:** Como desenvolvedor, quero um sistema de autenticação unificado e simples, para que eu possa manter e debugar facilmente o código sem conflitos entre diferentes implementações.

#### Acceptance Criteria

1. WHEN analisando o código THEN deve existir apenas UM hook principal de autenticação (useAuth)
2. WHEN analisando o código THEN deve existir apenas UM contexto de autenticação (AuthContext)
3. WHEN analisando o código THEN deve existir apenas UM serviço de autenticação principal
4. WHEN analisando o código THEN NÃO deve haver hooks duplicados como useAuth vs use-auth vs usePermissions com funcionalidades sobrepostas
5. WHEN analisando o código THEN NÃO deve haver múltiplos sistemas de role management conflitantes

### Requirement 2

**User Story:** Como usuário do sistema, quero que o fluxo de autenticação seja direto e funcional, para que eu possa fazer login, selecionar meu tipo de usuário e acessar as funcionalidades sem erros.

#### Acceptance Criteria

1. WHEN um usuário faz login THEN ele deve ser redirecionado corretamente baseado em seu status
2. WHEN um usuário novo se registra THEN ele deve poder selecionar entre mentor, mentee ou admin
3. WHEN um usuário seleciona uma role THEN a role deve ser persistida corretamente no JWT e banco de dados
4. WHEN um usuário acessa uma página protegida THEN as permissões devem ser verificadas corretamente
5. WHEN um usuário faz logout THEN toda a sessão deve ser limpa e ele deve ser redirecionado para home

### Requirement 3

**User Story:** Como administrador do sistema, quero que as permissões sejam simples e claras, para que eu possa gerenciar usuários sem complexidade desnecessária.

#### Acceptance Criteria

1. WHEN verificando permissões THEN deve haver apenas 3 roles: mentor, mentee, admin
2. WHEN verificando permissões THEN admin deve ter acesso total
3. WHEN verificando permissões THEN mentor deve poder gerenciar disponibilidade e sessões
4. WHEN verificando permissões THEN mentee deve poder visualizar mentores e agendar sessões
5. WHEN verificando permissões THEN as permissões devem ser baseadas apenas na role, sem complexidade adicional

### Requirement 4

**User Story:** Como desenvolvedor, quero que o banco de dados tenha uma estrutura simples e consistente, para que não haja conflitos entre diferentes tabelas de usuários e roles.

#### Acceptance Criteria

1. WHEN analisando o banco THEN deve existir apenas UMA tabela principal de profiles
2. WHEN analisando o banco THEN deve existir apenas UM sistema de roles (roles + user_roles)
3. WHEN analisando o banco THEN NÃO deve haver tabelas duplicadas ou obsoletas de usuários
4. WHEN analisando o banco THEN as policies RLS devem ser simples e funcionais
5. WHEN analisando o banco THEN deve haver triggers apropriados para manter consistência

### Requirement 5

**User Story:** Como usuário, quero que o sistema funcione de forma confiável em produção, para que eu possa usar a plataforma sem erros durante a apresentação na Campus Party.

#### Acceptance Criteria

1. WHEN testando o sistema THEN o login deve funcionar 100% das vezes
2. WHEN testando o sistema THEN a seleção de role deve funcionar 100% das vezes  
3. WHEN testando o sistema THEN as permissões devem ser aplicadas corretamente
4. WHEN testando o sistema THEN o logout deve funcionar 100% das vezes
5. WHEN testando o sistema THEN NÃO deve haver erros de console relacionados à autenticação
