# Fluxo de Verificação de Mentores

## Visão Geral

Este documento descreve o processo completo de verificação de mentores na plataforma Menvo.

## Fluxo Completo

### 1. Cadastro do Mentor

Quando um usuário se cadastra como mentor:
- O perfil é criado com `verified = false`
- O campo `verified_at` é `null`
- O mentor **NÃO** aparece na listagem pública de mentores

### 2. Completar Perfil

O mentor deve completar seu perfil com as seguintes informações **obrigatórias**:
- ✅ Nome (first_name)
- ✅ Sobrenome (last_name)
- ✅ Bio (bio) - não pode estar vazia

**Informações recomendadas:**
- Cargo atual (job_title)
- Empresa (company)
- Áreas de expertise (expertise_areas)
- Tópicos de mentoria (mentorship_topics)
- Localização (city, state, country)

### 3. Verificação pelo Admin

O administrador acessa o painel de verificação em `/admin/mentors/verify` onde verá:

#### Mentores Prontos para Verificação
- Mentores com perfil completo (nome, sobrenome e bio preenchidos)
- Podem ser verificados individualmente ou em lote
- Botão "Verificar" habilitado

#### Mentores com Perfil Incompleto
- Mentores que ainda não completaram as informações obrigatórias
- Botão "Verificar" desabilitado
- Alerta visual mostrando o que está faltando

### 4. Após Verificação

Quando o admin verifica um mentor:
- `verified` é definido como `true`
- `verified_at` recebe o timestamp atual
- O mentor **passa a aparecer** na listagem pública (`/mentors`)
- O mentor pode receber agendamentos

## Views do Banco de Dados

### `mentors_view` (Pública)
Mostra apenas mentores que atendem **TODOS** os critérios:
- ✅ `verified = true`
- ✅ `verified_at IS NOT NULL`
- ✅ `first_name IS NOT NULL`
- ✅ `last_name IS NOT NULL`
- ✅ `bio IS NOT NULL AND LENGTH(TRIM(bio)) > 0`

### `mentors_admin_view` (Admin)
Mostra **TODOS** os mentores, independente de verificação, com campo adicional:
- `profile_status`: indica se o perfil está completo, incompleto ou verificado

## Validações de Segurança

### Na Listagem Pública (`/mentors`)
- Usa `mentors_view` que filtra automaticamente
- Apenas mentores verificados e com perfil completo aparecem

### Na Criação de Agendamentos
```typescript
if (!mentorProfile.verified) {
  return NextResponse.json(
    { error: 'Mentor is not verified' },
    { status: 400 }
  );
}
```

### No Painel Admin
- Botão de verificação desabilitado se perfil incompleto
- Toast de erro se tentar verificar perfil incompleto
- Separação visual entre mentores prontos e incompletos

## Aplicar as Mudanças

Para aplicar as correções no banco de dados:

```bash
# Aplicar a migration
npx supabase db push

# Ou se estiver usando migrations locais
npx supabase migration up
```

## Verificar Mentores Existentes

Se você já tem mentores cadastrados que não aparecem:

```sql
-- Ver status de todos os mentores
SELECT 
  id,
  full_name,
  first_name,
  last_name,
  verified,
  verified_at,
  CASE 
    WHEN first_name IS NULL THEN 'Falta nome'
    WHEN last_name IS NULL THEN 'Falta sobrenome'
    WHEN bio IS NULL OR LENGTH(TRIM(bio)) = 0 THEN 'Falta bio'
    WHEN verified = false THEN 'Não verificado'
    ELSE 'OK'
  END as status
FROM profiles p
JOIN user_roles ur ON p.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'mentor';

-- Verificar um mentor específico (após completar o perfil)
UPDATE profiles
SET 
  verified = true,
  verified_at = NOW()
WHERE id = 'MENTOR_ID_AQUI';
```

## Resumo

O fluxo garante que:
1. ✅ Apenas mentores verificados aparecem publicamente
2. ✅ Apenas mentores com perfil completo podem ser verificados
3. ✅ Admins têm visibilidade de todos os mentores e seus status
4. ✅ O processo é seguro e controlado
