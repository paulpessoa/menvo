# Sistema de Migração de Usuários

Este documento descreve o sistema completo de migração de usuários da plataforma antiga para a nova estrutura.

## Visão Geral

O sistema de migração permite:
- Identificar usuários da plataforma antiga
- Migrar dados preservando informações essenciais
- Resolver conflitos de dados automaticamente ou manualmente
- Notificar usuários sobre a migração
- Auditar todo o processo

## Componentes do Sistema

### 1. Estrutura do Banco de Dados

#### Tabela `user_migrations`
Armazena informações sobre cada migração de usuário:
- `old_user_id`: ID do usuário na plataforma antiga
- `new_user_id`: ID gerado na nova plataforma
- `email`: Email do usuário
- `old_user_data`: Dados completos do usuário antigo (JSONB)
- `migration_status`: Status da migração (pending, completed, failed, conflict)
- `migration_notes`: Notas sobre a migração
- `conflict_reason`: Razão do conflito se houver

#### Tabela `migration_audit_logs`
Registra todas as ações realizadas durante a migração:
- `migration_id`: Referência à migração
- `action`: Tipo de ação realizada
- `details`: Detalhes da ação (JSONB)
- `performed_by`: Usuário que realizou a ação

### 2. Script de Migração (`scripts/migrate-users.ts`)

#### Funcionalidades:
- Carrega dados de usuários da plataforma antiga
- Verifica usuários existentes para evitar duplicatas
- Cria usuários no Supabase Auth
- Cria perfis na nova estrutura
- Mapeia roles entre sistemas
- Trata conflitos automaticamente

#### Uso:
```bash
# Executar migração
npm run migrate-users

# Ou via API administrativa
POST /api/admin/run-migration
```

### 3. Interface Administrativa (`/admin/users/migrations`)

#### Recursos:
- Dashboard com estatísticas de migração
- Lista de todas as migrações com filtros
- Visualização detalhada de cada migração
- Resolução manual de conflitos
- Execução de migração via interface

#### Acesso:
Apenas usuários com role `admin` podem acessar.

### 4. Sistema de Notificações

#### Funcionalidades:
- Envio automático de emails para usuários migrados
- Geração de senhas temporárias
- Templates de email personalizados
- Processamento em lotes

#### Configuração:
Requer configuração do Brevo SMTP:
```env
BREVO_SMTP_USER=your_brevo_smtp_user
BREVO_SMTP_PASSWORD=your_brevo_smtp_password
BREVO_FROM_EMAIL=noreply@yourdomain.com
```

## Fluxo de Migração

### 1. Preparação dos Dados
```json
// Exemplo de estrutura de dados antigos
{
  "id": "old_user_1",
  "email": "user@example.com",
  "first_name": "João",
  "last_name": "Silva",
  "role": "mentor",
  "profile_data": {
    "bio": "Mentor experiente",
    "expertise": ["JavaScript", "React"]
  }
}
```

### 2. Processo de Migração

1. **Identificação**: Script identifica usuários da fonte de dados
2. **Verificação**: Checa se usuário já existe na nova plataforma
3. **Criação**: Cria usuário no Supabase Auth se não existir
4. **Perfil**: Cria perfil na tabela `profiles`
5. **Roles**: Mapeia e atribui roles apropriados
6. **Auditoria**: Registra todas as ações

### 3. Tratamento de Conflitos

#### Tipos de Conflito:
- **Email Duplicado**: Usuário já existe na nova plataforma
- **Dados Inconsistentes**: Informações conflitantes
- **Roles Incompatíveis**: Role não existe no novo sistema

#### Resolução:
- **Automática**: Para casos simples (ex: mapeamento de roles)
- **Manual**: Via interface administrativa para casos complexos

### 4. Notificação de Usuários

Após migração bem-sucedida:
1. Gera senha temporária
2. Envia email com credenciais
3. Instrui sobre primeiro acesso
4. Marca como notificado no sistema

## Mapeamento de Dados

### Roles
```typescript
const roleMap = {
  'mentor': 'mentor',
  'mentee': 'mentee',
  'mentorado': 'mentee',
  'admin': 'admin',
  'administrator': 'admin'
}
```

### Campos do Perfil
- `first_name` → `first_name`
- `last_name` → `last_name`
- `profile_data.bio` → `bio`
- `profile_data.expertise` → `expertise_areas`
- `profile_data.interests` → `expertise_areas`

## Segurança

### Controle de Acesso
- Apenas admins podem executar migrações
- RLS policies protegem dados sensíveis
- Auditoria completa de todas as ações

### Senhas Temporárias
- Geradas aleatoriamente (12 caracteres)
- Enviadas apenas por email
- Hash armazenado para auditoria (não para autenticação)

## Monitoramento

### Logs de Auditoria
Todas as ações são registradas:
- Criação de migração
- Mudanças de status
- Resolução de conflitos
- Envio de notificações

### Métricas
- Total de usuários migrados
- Taxa de sucesso
- Conflitos pendentes
- Notificações enviadas

## Troubleshooting

### Problemas Comuns

#### 1. Erro de Email Duplicado
```
Solução: Resolver via interface administrativa
- Opção 1: Mesclar dados com usuário existente
- Opção 2: Pular migração
```

#### 2. Falha na Criação de Usuário
```
Possíveis causas:
- Email inválido
- Problemas de conectividade
- Limites de rate do Supabase

Solução: Verificar logs e tentar novamente
```

#### 3. Notificações Não Enviadas
```
Verificar:
- Configuração do Resend API
- Domínio de email configurado
- Limites de envio
```

## Comandos Úteis

```bash
# Verificar status das migrações
supabase db status

# Aplicar migrações
supabase db push

# Executar migração de usuários
npm run migrate-users

# Enviar notificações pendentes
curl -X POST /api/admin/send-migration-notifications
```

## Configuração de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Brevo SMTP
BREVO_SMTP_USER=your_brevo_smtp_user
BREVO_SMTP_PASSWORD=your_brevo_smtp_password
BREVO_FROM_EMAIL=noreply@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

## Backup e Rollback

### Antes da Migração
1. Backup completo do banco de dados
2. Backup dos dados da plataforma antiga
3. Teste em ambiente de staging

### Em Caso de Problemas
1. Parar processo de migração
2. Reverter migrações se necessário
3. Restaurar backup se crítico
4. Analisar logs de auditoria

## Próximos Passos

Após implementação:
1. Testar com dados de exemplo
2. Executar migração piloto
3. Monitorar métricas
4. Ajustar conforme necessário
5. Migração completa
6. Cleanup de dados antigos