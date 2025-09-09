# Guia de Gerenciamento de Mentores

## 🔍 Verificar Status Atual

### Ver todos os perfis:
\`\`\`bash
docker exec -it supabase_db_menvo psql -U postgres -d postgres -c "SELECT email, first_name, last_name, verified FROM public.profiles ORDER BY created_at DESC;"
\`\`\`

### Ver apenas mentores não verificados:
\`\`\`bash
docker exec -it supabase_db_menvo psql -U postgres -d postgres -c "SELECT p.email, p.first_name, p.last_name, p.verified, r.name as role FROM public.profiles p LEFT JOIN public.user_roles ur ON p.id = ur.user_id LEFT JOIN public.roles r ON ur.role_id = r.id WHERE r.name = 'mentor' AND p.verified = false;"
\`\`\`

### Ver mentores já verificados:
\`\`\`bash
docker exec -it supabase_db_menvo psql -U postgres -d postgres -c "SELECT p.email, p.first_name, p.last_name, p.verified, r.name as role FROM public.profiles p LEFT JOIN public.user_roles ur ON p.id = ur.user_id LEFT JOIN public.roles r ON ur.role_id = r.id WHERE r.name = 'mentor' AND p.verified = true;"
\`\`\`

## ✅ Aprovar Mentores

### Aprovar um mentor específico (substitua o email):
\`\`\`bash
docker exec -it supabase_db_menvo psql -U postgres -d postgres -c "UPDATE public.profiles SET verified = true, updated_at = NOW() WHERE email = 'email@exemplo.com';"
\`\`\`

### Aprovar TODOS os mentores pendentes (CUIDADO!):
\`\`\`bash
docker exec -it supabase_db_menvo psql -U postgres -d postgres -c "UPDATE public.profiles SET verified = true, updated_at = NOW() WHERE id IN (SELECT p.id FROM public.profiles p JOIN public.user_roles ur ON p.id = ur.user_id JOIN public.roles r ON ur.role_id = r.id WHERE r.name = 'mentor' AND p.verified = false);"
\`\`\`

## 🚫 Desaprovar Mentores

### Desaprovar um mentor específico:
\`\`\`bash
docker exec -it supabase_db_menvo psql -U postgres -d postgres -c "UPDATE public.profiles SET verified = false, updated_at = NOW() WHERE email = 'email@exemplo.com';"
\`\`\`

## 👤 Criar Usuário Admin

### Para usar a API de verificação, você precisa de um admin:
\`\`\`bash
# 1. Primeiro registre um usuário normal via frontend
# 2. Depois execute este comando para torná-lo admin:
docker exec -it supabase_db_menvo psql -U postgres -d postgres -c "INSERT INTO public.user_roles (user_id, role_id) SELECT p.id, r.id FROM public.profiles p, public.roles r WHERE p.email = 'seu-admin@email.com' AND r.name = 'admin';"
\`\`\`

## 🧪 Testar Registro

### Para testar se o trigger está funcionando:
1. Acesse http://localhost:3000 e registre um novo usuário
2. Verifique se o perfil foi criado automaticamente
3. Aprove o mentor se necessário

## 📊 Estatísticas Rápidas

### Contar usuários por tipo:
\`\`\`bash
docker exec -it supabase_db_menvo psql -U postgres -d postgres -c "SELECT r.name as role, COUNT(*) as total, COUNT(CASE WHEN p.verified THEN 1 END) as verified FROM public.profiles p LEFT JOIN public.user_roles ur ON p.id = ur.user_id LEFT JOIN public.roles r ON ur.role_id = r.id GROUP BY r.name;"
\`\`\`

### Ver últimos registros:
\`\`\`bash
docker exec -it supabase_db_menvo psql -U postgres -d postgres -c "SELECT email, first_name, last_name, verified, created_at FROM public.profiles ORDER BY created_at DESC LIMIT 10;"
\`\`\`
