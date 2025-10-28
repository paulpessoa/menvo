# Guia: Testar Correção Localmente Antes de Aplicar em Produção

## 1. Iniciar Supabase Local

```bash
# Iniciar o Supabase local (se ainda não estiver rodando)
npx supabase start
```

Isso vai:
- Iniciar o banco de dados PostgreSQL local
- Aplicar todas as migrations (incluindo a nova)
- Iniciar o Supabase Studio local em http://127.0.0.1:54323

## 2. Verificar se a Migration Foi Aplicada

```bash
# Ver status das migrations
npx supabase migration list
```

A migration `20251028000001_fix_mentors_view_verification.sql` deve aparecer como aplicada.

## 3. Testar no Supabase Studio Local

1. Abra http://127.0.0.1:54323
2. Vá em "SQL Editor"
3. Execute este teste:

```sql
-- Ver quantos mentores aparecem na view pública
SELECT COUNT(*) as mentores_publicos FROM mentors_view;

-- Ver todos os mentores e seus status
SELECT 
  full_name,
  first_name,
  last_name,
  bio,
  verified,
  verified_at,
  profile_status
FROM mentors_admin_view
ORDER BY created_at DESC;

-- Ver detalhes de um mentor específico
SELECT * FROM mentors_view LIMIT 1;
```

## 4. Testar na Aplicação Local

```bash
# Certifique-se de que está usando as variáveis locais
# Verifique se .env.local aponta para o Supabase local:
# NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua_chave_local>

# Iniciar a aplicação
npm run dev
```

### Testes a Fazer:

**A. Listagem Pública de Mentores**
1. Acesse http://localhost:3000/mentors (sem login)
2. ✅ Deve mostrar apenas mentores verificados com perfil completo
3. ❌ Não deve mostrar mentores sem nome ou bio

**B. Painel Admin**
1. Faça login como admin
2. Acesse http://localhost:3000/admin/mentors/verify
3. ✅ Deve separar mentores em dois grupos:
   - "Prontos para Verificação" (perfil completo)
   - "Perfis Incompletos" (faltando dados)
4. ✅ Botão "Verificar" deve estar desabilitado para perfis incompletos
5. ✅ Deve mostrar alerta visual do que está faltando

**C. Criar Mentor de Teste**
1. Crie um novo usuário mentor
2. Deixe o perfil incompleto (sem bio)
3. Verifique que ele NÃO aparece em /mentors
4. Verifique que ele aparece em "Perfis Incompletos" no admin
5. Complete o perfil (adicione bio)
6. Verifique no admin e aprove
7. Verifique que agora ele aparece em /mentors

## 5. Se Tudo Funcionar Localmente

Então você pode aplicar em produção:

```bash
# Fazer push das migrations para produção
npx supabase db push --linked

# Ou se preferir fazer manualmente:
# 1. Acesse o Supabase Dashboard de produção
# 2. Vá em SQL Editor
# 3. Copie e cole o conteúdo de:
#    supabase/migrations/20251028000001_fix_mentors_view_verification.sql
# 4. Execute
```

## 6. Verificar em Produção

Após aplicar em produção, execute os mesmos testes:

```sql
-- No SQL Editor de produção
SELECT COUNT(*) as mentores_publicos FROM mentors_view;
SELECT COUNT(*) as total_mentores FROM mentors_admin_view;

-- Ver status dos mentores
SELECT 
  full_name,
  verified,
  profile_status
FROM mentors_admin_view;
```

## Troubleshooting

### Se a migration não aplicar localmente:
```bash
# Resetar o banco local (CUIDADO: apaga dados locais)
npx supabase db reset

# Ou aplicar manualmente
npx supabase db push
```

### Se encontrar erros:
1. Verifique os logs: `npx supabase status`
2. Veja os logs do banco: `npx supabase logs db`
3. Verifique se há conflitos com migrations anteriores

### Para reverter localmente (se necessário):
```bash
# Resetar para estado anterior
npx supabase db reset
```

## Resumo do Fluxo

1. ✅ Testar LOCAL primeiro (Supabase local + app local)
2. ✅ Verificar que tudo funciona
3. ✅ Aplicar em PRODUÇÃO
4. ✅ Verificar em produção
5. ✅ Monitorar por alguns dias

## Comandos Úteis

```bash
# Ver status do Supabase local
npx supabase status

# Ver logs
npx supabase logs db

# Parar Supabase local
npx supabase stop

# Resetar banco local (apaga tudo)
npx supabase db reset
```
