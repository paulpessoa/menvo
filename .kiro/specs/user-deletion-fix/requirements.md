# Requirements Document

## Introduction

Este documento define os requisitos para corrigir o problema de deleção de usuários da tabela auth.users que está falhando devido a erro de coluna "mentor_id" não existente. O erro indica problemas com constraints de chave estrangeira ou triggers que referenciam colunas inexistentes durante o processo de cascade delete.

## Requirements

### Requirement 1

**User Story:** Como administrador, eu quero deletar usuários da tabela auth.users sem erros de banco de dados, para que possa gerenciar usuários de forma eficiente.

#### Acceptance Criteria

1. WHEN deletando usuário THEN o sistema SHALL executar a operação sem erro de "column mentor_id does not exist"
2. WHEN deletando usuário THEN o sistema SHALL remover todos os dados relacionados em cascade
3. WHEN deletando usuário THEN o sistema SHALL manter integridade referencial do banco
4. WHEN deletando usuário THEN o sistema SHALL registrar a operação nos logs de auditoria
5. WHEN falha na deleção THEN o sistema SHALL retornar mensagem de erro clara e específica

### Requirement 2

**User Story:** Como desenvolvedor, eu quero identificar e corrigir triggers ou constraints problemáticos, para que as operações de deleção funcionem corretamente.

#### Acceptance Criteria

1. WHEN analisando triggers THEN o sistema SHALL identificar triggers que referenciam colunas inexistentes
2. WHEN analisando constraints THEN o sistema SHALL identificar foreign keys com referências inválidas
3. WHEN corrigindo triggers THEN o sistema SHALL atualizar ou remover triggers problemáticos
4. WHEN corrigindo constraints THEN o sistema SHALL ajustar ou remover foreign keys inválidas
5. WHEN aplicando correções THEN o sistema SHALL validar que não quebra funcionalidades existentes

### Requirement 3

**User Story:** Como desenvolvedor, eu quero um sistema de cascade delete robusto, para que a deleção de usuários limpe automaticamente todos os dados relacionados.

#### Acceptance Criteria

1. WHEN usuário é deletado THEN o sistema SHALL remover perfil da tabela profiles
2. WHEN usuário é deletado THEN o sistema SHALL remover roles da tabela user_roles
3. WHEN usuário é deletado THEN o sistema SHALL remover disponibilidade da tabela mentor_availability
4. WHEN usuário é deletado THEN o sistema SHALL remover agendamentos da tabela appointments
5. WHEN usuário é deletado THEN o sistema SHALL remover dados de todas as tabelas relacionadas

### Requirement 4

**User Story:** Como administrador, eu quero logs detalhados das operações de deleção, para que possa auditar e debuggar problemas futuros.

#### Acceptance Criteria

1. WHEN iniciando deleção THEN o sistema SHALL registrar tentativa com ID do usuário e timestamp
2. WHEN deleção falha THEN o sistema SHALL registrar erro específico e stack trace
3. WHEN deleção sucede THEN o sistema SHALL registrar sucesso e dados removidos
4. WHEN acessando logs THEN o sistema SHALL permitir filtrar por tipo de operação
5. WHEN analisando logs THEN o sistema SHALL mostrar informações suficientes para debugging

### Requirement 5

**User Story:** Como desenvolvedor, eu quero validação prévia antes da deleção, para que possa identificar problemas antes de executar a operação.

#### Acceptance Criteria

1. WHEN validando deleção THEN o sistema SHALL verificar se usuário existe
2. WHEN validando deleção THEN o sistema SHALL verificar dependências e relacionamentos
3. WHEN validando deleção THEN o sistema SHALL identificar possíveis problemas de integridade
4. WHEN validação falha THEN o sistema SHALL retornar lista específica de problemas
5. WHEN validação passa THEN o sistema SHALL permitir prosseguir com deleção segura