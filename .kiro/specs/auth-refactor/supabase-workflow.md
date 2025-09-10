# Supabase Backup e Workflow Local

## 1. Backup dos Dados de Produção

### Backup da tabela auth.users (CRÍTICO)
```bash
# Conectar ao projeto de produção
supabase login

# Fazer backup dos usuários
supabase db dump --db-url "postgresql://postgres:[SUA_SENHA]@db.[SEU_PROJECT_ID].supabase.co:5432/postgres" --data-only --table auth.users > backup_auth_users.sql

# Backup de todas as tabelas customizadas
supabase db dump --db-url "postgresql://postgres:[SUA_SENHA]@db.[SEU_PROJECT_ID].supabase.co:5432/postgres" --data-only --exclude-table auth.* > backup_custom_tables.sql

# Backup do schema completo (estrutura)
supabase db dump --db-url "postgresql://postgres:[SUA_SENHA]@db.[SEU_PROJECT_ID].supabase.co:5432/postgres" --schema-only > backup_schema.sql
```

### Backup via Dashboard (alternativa)
1. Acesse o Supabase Dashboard
2. Vá em Settings > Database
3. Clique em "Database backups"
4. Faça download do backup mais recente

## 2. Configuração do Ambiente Local

### Inicializar Supabase Local
```bash
# No diretório do projeto
supabase init

# Iniciar containers locais
supabase start

# Verificar status
supabase status
```

### Aplicar Schema Atual
```bash
# Gerar migrações baseadas no schema remoto
supabase db diff --use-migra -f initial_schema

# Aplicar migrações localmente
supabase db reset
```

### Restaurar Dados de Usuários
```bash
# Restaurar usuários (IMPORTANTE: fazer primeiro)
psql -h localhost -p 54322 -U postgres -d postgres -f backup_auth_users.sql

# Restaurar dados customizados (se necessário)
psql -h localhost -p 54322 -U postgres -d postgres -f backup_custom_tables.sql
```

## 3. Desenvolvimento Local

### URLs Locais
- **API URL**: http://localhost:54321
- **DB URL**: postgresql://postgres:postgres@localhost:54322/postgres
- **Studio URL**: http://localhost:54323
- **Inbucket URL**: http://localhost:54324

### Configurar .env.local
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY_LOCAL]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY_LOCAL]
```

### Comandos Úteis Durante Desenvolvimento
```bash
# Ver logs em tempo real
supabase logs

# Resetar banco local (cuidado!)
supabase db reset

# Aplicar nova migração
supabase db diff -f nome_da_migracao
supabase db reset

# Parar ambiente local
supabase stop
```

## 4. Testando as Alterações

### Checklist de Testes Locais
- [ ] Cadastro com email funciona
- [ ] Login com email funciona  
- [ ] Cadastro com Google funciona
- [ ] Login com Google funciona
- [ ] Cadastro com LinkedIn funciona
- [ ] Login com LinkedIn funciona
- [ ] Perfil é criado automaticamente
- [ ] Roles são atribuídas corretamente
- [ ] JWT contém informações corretas
- [ ] Proteção de rotas funciona
- [ ] Logout funciona corretamente

## 5. Deploy para Produção

### Gerar Migrações Finais
```bash
# Comparar local com produção
supabase db diff --use-migra -f final_refactor

# Revisar migração gerada
cat supabase/migrations/[timestamp]_final_refactor.sql
```

### Aplicar em Produção
```bash
# Fazer backup final antes do deploy
supabase db dump --db-url "postgresql://postgres:[SUA_SENHA]@db.[SEU_PROJECT_ID].supabase.co:5432/postgres" > backup_pre_refactor.sql

# Aplicar migrações em produção
supabase db push

# Verificar se tudo funcionou
supabase db diff --use-migra
```

### Deploy do Frontend
```bash
# Atualizar variáveis de ambiente de produção
# NEXT_PUBLIC_SUPABASE_URL=[URL_PRODUCAO]
# NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY_PRODUCAO]

# Deploy via Vercel
vercel --prod
```

## 6. Rollback (Se Necessário)

### Rollback do Banco
```bash
# Restaurar backup completo
psql -h db.[SEU_PROJECT_ID].supabase.co -p 5432 -U postgres -d postgres -f backup_pre_refactor.sql
```

### Rollback do Frontend
```bash
# Via Vercel Dashboard ou CLI
vercel rollback [DEPLOYMENT_URL]
```

## 7. Monitoramento Pós-Deploy

### Verificações Essenciais
- [ ] Usuários existentes conseguem fazer login
- [ ] Novos cadastros funcionam
- [ ] Não há erros no console do Supabase
- [ ] Não há erros no Vercel
- [ ] Performance mantida ou melhorada
- [ ] Todos os fluxos de auth funcionam

### Comandos de Monitoramento
```bash
# Ver logs de produção
supabase logs --project-ref [SEU_PROJECT_ID]

# Verificar saúde do banco
supabase db inspect --project-ref [SEU_PROJECT_ID]
```

## Notas Importantes

⚠️ **SEMPRE** faça backup antes de qualquer alteração em produção
⚠️ **TESTE TUDO** no ambiente local antes de fazer deploy
⚠️ **MANTENHA** os backups por pelo menos 30 dias
⚠️ **MONITORE** o sistema por 24h após o deploy