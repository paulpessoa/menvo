# Implementation Plan

- [x] 1. Identificar triggers problemáticos no banco



  - Executar query para listar todos os triggers ativos
  - Identificar triggers que referenciam colunas inexistentes (mentor_id, updated_at)
  - _Requirements: 2.1, 2.2_



- [ ] 2. Corrigir triggers de deleção de usuários
  - Localizar trigger que causa erro "mentor_id does not exist"
  - Corrigir ou remover trigger problemático

  - Testar deleção de usuário específico
  - _Requirements: 1.1, 1.2, 2.3_

- [ ] 3. Corrigir triggers de atualização de roles
  - Localizar trigger que causa erro "updated_at does not exist"



  - Corrigir referência para coluna correta ou remover campo
  - Testar atualização de role de usuário
  - _Requirements: 2.1, 2.4_

- [ ] 4. Validar cascade deletes funcionando
  - Testar deleção completa de usuário
  - Verificar limpeza de dados relacionados (profiles, user_roles, appointments)
  - Confirmar que não há dados órfãos
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_