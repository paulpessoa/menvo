# Como Aplicar a Correção de Verificação de Mentores

## Problema Identificado

Mentores não verificados e com perfis incompletos estavam aparecendo na listagem pública.

## Solução Implementada

1. ✅ Atualizada a view `mentors_view` para filtrar apenas mentores verificados com perfil completo
2. ✅ Criada validação no painel admin para impedir verificação de perfis incompletos
3. ✅ Adicionado alerta visual mostrando o que está faltando no perfil
4. ✅ Separação entre mentores prontos e incompletos no painel admin

## Passos para Aplicar

### 1. Aplicar a Migration no Banco de Dados

Você tem duas opções:

#### Opção A: Via Supabase CLI (Recomendado)
```bash
npx supabase db push
```

#### Opção B: Via Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Copie e cole o conteúdo do arquivo: `supabase/migrations/20251028000001_fix_mentors_view_verification.sql`
4. Execute o script

### 2. Verificar se Funcionou

Execute este SQL no Supabase SQL Editor:

```sql
-- Ver quantos mentores aparecem publicamente
SELECT COUNT(*) as mentores_publicos FROM mentors_view;

-- Ver todos os mentores e seus status
SELECT 
  full_name,
  verified,
  profile_status
FROM mentors_admin_view
ORDER BY created_at DESC;
```

### 3. Testar na Aplicação

1. **Teste a listagem pública:**
   - Acesse `/mentors` (sem estar logado)
   - Deve mostrar apenas mentores verificados com perfil completo

2. **Teste o painel admin:**
   - Acesse `/admin/mentors/verify`
   - Deve mostrar dois grupos:
     - "Prontos para Verificação" (com perfil completo)
     - "Perfis Incompletos" (faltando informações)

3. **Teste a verificação:**
   - Tente verificar um mentor com perfil incompleto
   - Deve mostrar erro e botão desabilitado
   - Verifique um mentor com perfil completo
   - Ele deve aparecer na listagem pública

## O Que Mudou

### Antes
- ❌ Mentores apareciam na listagem pública mesmo sem verificação
- ❌ Mentores sem nome ou bio apareciam
- ❌ Admin podia verificar perfis incompletos

### Depois
- ✅ Apenas mentores verificados aparecem publicamente
- ✅ Apenas mentores com nome, sobrenome e bio aparecem
- ✅ Admin não pode verificar perfis incompletos
- ✅ Alerta visual mostra o que está faltando

## Campos Obrigatórios para Publicação

Para um mentor aparecer na listagem pública, ele precisa:

1. ✅ `verified = true` (verificado pelo admin)
2. ✅ `verified_at` preenchido (timestamp da verificação)
3. ✅ `first_name` preenchido
4. ✅ `last_name` preenchido
5. ✅ `bio` preenchida e não vazia

## Próximos Passos

1. Aplique a migration no banco de dados
2. Teste a listagem pública
3. Oriente os mentores a completarem seus perfis
4. Use o painel admin para verificar mentores com perfil completo

## Suporte

Se tiver problemas:
1. Verifique os logs do Supabase
2. Execute o script `scripts/fix-mentor-verification.sql` para diagnóstico
3. Consulte a documentação completa em `docs/MENTOR_VERIFICATION_FLOW.md`
