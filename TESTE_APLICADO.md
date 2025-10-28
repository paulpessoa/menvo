# ✅ Migration Aplicada em Produção!

A migration `20251028000001_fix_mentors_view_verification.sql` foi aplicada com sucesso no banco de dados de **PRODUÇÃO**.

## O que foi feito:

1. ✅ Adicionado campo `verified_at` na tabela `profiles`
2. ✅ Atualizada a view `mentors_view` para filtrar apenas mentores verificados com perfil completo
3. ✅ Criada a view `mentors_admin_view` para o painel admin

## Próximos Passos para Testar:

### 1. Testar no Supabase Dashboard

Acesse o SQL Editor do Supabase e execute:

```sql
-- Ver quantos mentores aparecem publicamente
SELECT COUNT(*) as mentores_publicos FROM mentors_view;

-- Ver todos os mentores e seus status
SELECT 
  full_name,
  first_name,
  last_name,
  verified,
  profile_status
FROM mentors_admin_view
ORDER BY created_at DESC;
```

Ou use o arquivo `test-mentors-view.sql` que criei.

### 2. Testar na Aplicação

**A. Listagem Pública** (http://localhost:3000/mentors ou seu domínio)
- Recarregue a página
- Deve mostrar apenas mentores verificados com perfil completo
- Não deve mostrar o erro "relation does not exist"

**B. Painel Admin** (http://localhost:3000/admin/mentors/verify)
- Faça login como admin
- Deve mostrar dois grupos:
  - "Prontos para Verificação" (perfil completo)
  - "Perfis Incompletos" (faltando dados)

### 3. Testar Criação de Novo Mentor

1. Crie um novo usuário mentor
2. Deixe o perfil incompleto (sem nome ou bio)
3. Verifique que ele NÃO aparece em `/mentors`
4. Verifique que ele aparece em "Perfis Incompletos" no admin
5. Complete o perfil
6. Verifique no admin e aprove
7. Verifique que agora ele aparece em `/mentors`

## Se Encontrar Problemas:

### Erro: "relation does not exist"
- Limpe o cache do navegador
- Reinicie o servidor Next.js: `npm run dev`
- Verifique se a migration foi aplicada: `npx supabase migration list`

### Mentores não aparecem
Execute no SQL Editor:
```sql
-- Ver se há mentores verificados com perfil completo
SELECT * FROM mentors_view;

-- Ver o que está faltando nos perfis
SELECT 
  full_name,
  first_name IS NOT NULL as tem_nome,
  last_name IS NOT NULL as tem_sobrenome,
  bio IS NOT NULL AND LENGTH(TRIM(bio)) > 0 as tem_bio,
  verified as esta_verificado
FROM profiles p
JOIN user_roles ur ON p.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'mentor';
```

## Reverter (se necessário)

Se precisar reverter a migration:

```sql
-- Remover as views
DROP VIEW IF EXISTS mentors_view CASCADE;
DROP VIEW IF EXISTS mentors_admin_view CASCADE;

-- Recriar a view antiga (sem filtros)
-- (copie o conteúdo da migration anterior)
```

## Status Atual

- ✅ Migration aplicada em PRODUÇÃO
- ⏳ Aguardando testes na aplicação
- ⏳ Aguardando validação dos resultados

## Comandos Úteis

```bash
# Ver status das migrations
npx supabase migration list

# Ver logs do banco
npx supabase logs db

# Conectar ao banco para testes
npx supabase db remote
```
