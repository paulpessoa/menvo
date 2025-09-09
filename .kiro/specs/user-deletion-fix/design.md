# Design Document

## Overview

Correção direta do erro "column mentor_id does not exist" ao deletar usuários. O problema está em triggers ou constraints que referenciam colunas inexistentes.

## Architecture

### Problemas Identificados
- **Erro 1**: `column "mentor_id" does not exist (SQLSTATE 42703)` ao deletar usuários
- **Erro 2**: `record "new" has no field "updated_at"` ao atualizar roles
- Ambos indicam triggers com referências a colunas inexistentes

### Solução
1. **Identificar triggers problemáticos** - Buscar triggers que referenciam mentor_id
2. **Corrigir ou remover triggers** - Atualizar para usar colunas corretas
3. **Validar cascade deletes** - Garantir que deleção limpa dados relacionados
4. **Testar deleção** - Verificar funcionamento completo

## Components and Interfaces

### Database Analysis
- Script para identificar triggers problemáticos
- Query para listar foreign keys inválidas
- Validação de estrutura de tabelas

### Migration Script
- Correção de triggers com referências inválidas
- Atualização de cascade deletes
- Limpeza de constraints obsoletas

### Validation Script
- Teste de deleção em ambiente seguro
- Verificação de integridade após correção

## Data Models

### Tabelas Afetadas
- `auth.users` (tabela principal)
- `profiles` (deve ter cascade delete)
- `user_roles` (deve ter cascade delete)
- `mentor_availability` (deve ter cascade delete)
- `appointments` (deve ter cascade delete)

## Error Handling

- Backup antes de aplicar correções
- Rollback automático se validação falhar
- Logs detalhados de cada operação

## Testing Strategy

- Teste em usuário específico primeiro
- Validação de integridade referencial
- Verificação de limpeza completa de dados relacionados
