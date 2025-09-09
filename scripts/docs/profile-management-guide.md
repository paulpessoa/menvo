# Guia de Gerenciamento de Perfis - CORRIGIDO ✅

## 🔧 Problemas Corrigidos

### ✅ **Storage configurado corretamente:**
- Bucket `profile-photos` criado
- Políticas RLS configuradas para upload/download
- Campo `avatar_url` corrigido na API

### ✅ **RLS (Row Level Security) corrigido:**
- Usuários podem atualizar seus próprios perfis
- Políticas mais permissivas para atualizações
- Service role pode criar perfis via trigger

### ✅ **APIs atualizadas:**
- Nova API `/api/profile/update` para GET e PUT
- API de upload corrigida para usar campo `avatar_url`
- Campos corretos da tabela `profiles`

## 📋 **Como usar agora:**

### 1. **Atualizar perfil via API:**

\`\`\`javascript
// GET - Buscar perfil do usuário logado
const response = await fetch('/api/profile/update', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

// PUT - Atualizar perfil
const response = await fetch('/api/profile/update', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    first_name: 'João',
    last_name: 'Silva',
    bio: 'Desenvolvedor Full Stack',
    city: 'São Paulo',
    job_title: 'Senior Developer',
    // ... outros campos
  }),
});
\`\`\`

### 2. **Upload de foto de perfil:**

\`\`\`javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/upload/profile-photo', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});
\`\`\`

### 3. **Campos disponíveis para atualização:**

\`\`\`javascript
const allowedFields = [
  'first_name',           // Nome
  'last_name',            // Sobrenome  
  'bio',                  // Biografia
  'avatar_url',           // URL do avatar
  'age',                  // Idade
  'city',                 // Cidade
  'state',                // Estado
  'country',              // País
  'timezone',             // Fuso horário
  'languages',            // Idiomas (array)
  'job_title',            // Cargo
  'company',              // Empresa
  'experience_years',     // Anos de experiência
  'mentorship_topics',    // Tópicos de mentoria (array)
  'inclusive_tags',       // Tags inclusivas (array)
  'session_price_usd',    // Preço da sessão em USD
  'availability_status',  // Status de disponibilidade
  'linkedin_url',         // LinkedIn
  'github_url',           // GitHub
  'twitter_url',          // Twitter
  'website_url',          // Website
  'phone',                // Telefone
  'expertise_areas'       // Áreas de expertise (array)
];
\`\`\`

## 🧪 **Testar localmente:**

### 1. **Verificar se está funcionando:**
\`\`\`bash
# Verificar buckets de storage
docker exec supabase_db_menvo psql -U postgres -d postgres -c "SELECT id, name, public FROM storage.buckets;"

# Verificar políticas RLS
docker exec supabase_db_menvo psql -U postgres -d postgres -c "SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'profiles';"
\`\`\`

### 2. **Testar via frontend:**
- Faça login no sistema
- Acesse a página de perfil
- Tente atualizar informações
- Tente fazer upload de uma foto

### 3. **Testar via API diretamente:**
- Use o script `scripts/test-profile-update.js`
- Ou use Postman/Insomnia com as rotas acima

## 🚀 **Status da produção:**

### ✅ **Aplicado na produção:**
- Migração `20250903024500_fix_storage_and_rls.sql` aplicada
- Bucket `profile-photos` criado
- Políticas RLS atualizadas
- APIs corrigidas

### 🎯 **Próximos passos:**
1. Testar no frontend de produção
2. Verificar se uploads funcionam
3. Confirmar que atualizações de perfil salvam corretamente

## 🔍 **Debugging:**

### Se ainda houver erro de RLS:
\`\`\`sql
-- Verificar se o usuário tem permissão
SELECT auth.uid(), id FROM public.profiles WHERE id = auth.uid();

-- Verificar políticas ativas
SELECT * FROM pg_policies WHERE tablename = 'profiles';
\`\`\`

### Se upload falhar:
\`\`\`sql
-- Verificar buckets
SELECT * FROM storage.buckets;

-- Verificar políticas de storage
SELECT * FROM storage.policies WHERE bucket_id = 'profile-photos';
\`\`\`

## 📝 **Logs úteis:**

As APIs agora têm logs detalhados. Verifique o console do servidor para:
- ✅ Usuário autenticado
- 📝 Dados recebidos  
- 🔄 Atualizando perfil
- ❌ Erros específicos

**Agora o sistema de perfis deve estar funcionando corretamente! 🎉**
