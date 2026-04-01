# 🛡️ Deployment Seguro - Passo a Passo

## Estratégia Recomendada: Testar em Staging Primeiro

### Opção A: Usar Supabase Branching (Recomendado)

```bash
# 1. Criar uma branch de preview no Supabase
supabase branches create preview-organizations

# 2. Aplicar migrations na branch de preview
supabase db push --db-url <preview-database-url>

# 3. Testar tudo na preview
# - Criar organização
# - Enviar convites
# - Testar dashboard
# - Verificar emails

# 4. Se tudo OK, aplicar na produção
supabase db push --db-url <production-database-url>
```

### Opção B: Backup Manual Antes de Aplicar

```bash
# 1. Fazer backup do banco de produção
supabase db dump --db-url <production-url> > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Verificar o que será aplicado
supabase db diff --db-url <production-url>

# 3. Aplicar migrations
supabase db push --db-url <production-url>

# 4. Se algo der errado, restaurar backup
psql <production-url> < backup_YYYYMMDD_HHMMSS.sql
```

### Opção C: Aplicar Migration por Migration (Mais Seguro)

```bash
# 1. Ver lista de migrations pendentes
supabase migration list

# 2. Aplicar uma por vez e testar
supabase db push --db-url <production-url> --include-all=false

# 3. Testar após cada migration
# 4. Se algo falhar, você sabe exatamente qual migration causou o problema
```

## ✅ Checklist de Segurança

Antes de aplicar em produção:

- [ ] Backup do banco de dados criado
- [ ] Migrations testadas localmente
- [ ] `supabase db diff` executado (sem diferenças inesperadas)
- [ ] Variáveis de ambiente configuradas
- [ ] Horário de baixo tráfego escolhido
- [ ] Equipe avisada sobre deployment
- [ ] Plano de rollback preparado

## 🔍 Verificações Pós-Deployment

Após aplicar as migrations:

```bash
# 1. Verificar se todas as tabelas foram criadas
psql <production-url> -c "\dt public.organization*"

# 2. Verificar se RLS está ativo
psql <production-url> -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'organization%';"

# 3. Verificar se as funções foram criadas
psql <production-url> -c "\df public.*organization*"

# 4. Testar uma query simples
psql <production-url> -c "SELECT COUNT(*) FROM organizations;"
```

## 🚨 Plano de Rollback

Se algo der errado:

```bash
# Opção 1: Restaurar do backup
psql <production-url> < backup_YYYYMMDD_HHMMSS.sql

# Opção 2: Reverter migrations específicas
supabase migration repair --status reverted <migration-id>

# Opção 3: Desabilitar feature temporariamente
# Adicionar no código:
# if (process.env.ENABLE_ORGANIZATIONS !== 'true') return null;
```

## 📊 O Que as Migrations Fazem

### Migrations de Organizações (16 arquivos):

1. **20251102223347** - Cria tabela `organizations`
2. **20251102231905** - Cria tabela `organization_members`
3. **20251103000605** - Cria tabela `mentor_visibility_settings`
4. **20251103003815** - Cria tabela `organization_activity_log`
5. **20251103010000** - Seed de visibilidade para mentores existentes
6. **20251103011728** - Adiciona coluna `organization_id` em `appointments`
7. **20251103012536** - Cria funções de quota
8. **20251103013304** - Cria funções de expiração
9. **20251103013616** - Cria funções de visibilidade
10. **20251103014418** - RLS policies para `organizations`
11. **20251103014641** - RLS policies para `organization_members`
12. **20251103015216** - RLS policies para `mentor_visibility_settings`
13. **20251103015248** - RLS policies para `organization_activity_log`

### Impacto:

- ✅ **Não altera tabelas existentes** (exceto adiciona 1 coluna nullable em appointments)
- ✅ **Não remove dados**
- ✅ **Não quebra funcionalidades existentes**
- ✅ **Totalmente backward compatible**

## 🎯 Recomendação Final

**Para máxima segurança:**

1. Fazer backup do banco
2. Aplicar em horário de baixo tráfego (madrugada)
3. Monitorar logs após aplicação
4. Ter plano de rollback pronto

**Comando seguro:**

```bash
# 1. Backup
supabase db dump > backup_before_organizations_$(date +%Y%m%d).sql

# 2. Aplicar
supabase db push

# 3. Verificar
supabase db diff
```

Se `supabase db diff` retornar "No schema changes found", está tudo certo! ✅
