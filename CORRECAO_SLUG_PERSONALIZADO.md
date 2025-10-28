# Correção: Slug Personalizado Sendo Sobrescrito

## Problema Identificado

Quando o usuário tentava definir um slug personalizado (ex: `mentor-demo`), ao atualizar a página o slug voltava para um valor auto-gerado (ex: `mentor-1`).

### Causa Raiz

O trigger `update_profile_slug_trigger` estava regenerando automaticamente o slug sempre que os campos `first_name` ou `last_name` eram atualizados, sobrescrevendo qualquer slug personalizado definido pelo usuário.

## Solução Implementada

Modificamos a função `update_profile_slug()` para respeitar slugs personalizados. Agora a função só regenera o slug automaticamente quando:

1. O slug está vazio ou NULL, OU
2. O slug parece ser auto-gerado (termina com padrão `-número`), OU
3. O usuário não modificou manualmente o slug

### Lógica da Correção

```sql
-- Verifica se o slug parece auto-gerado
is_auto_generated := OLD.slug ~ '-\d+$';

-- Só atualiza se:
-- 1. Slug vazio/NULL
-- 2. Slug auto-gerado E não foi modificado pelo usuário
-- 3. Nome foi alterado
IF (OLD.slug IS NULL OR OLD.slug = '' OR 
    (is_auto_generated AND OLD.slug = NEW.slug)) AND
   (OLD.first_name IS DISTINCT FROM NEW.first_name OR 
    OLD.last_name IS DISTINCT FROM NEW.last_name) AND
   (NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL) THEN
  -- Gera novo slug
END IF;
```

## Comportamento Após a Correção

### Cenário 1: Novo Usuário
- Slug é gerado automaticamente do email: `joao-silva`
- Se já existir, adiciona número: `joao-silva-1`

### Cenário 2: Usuário Atualiza Nome (Slug Auto-gerado)
- Usuário tem slug: `joao-silva-1` (auto-gerado)
- Atualiza nome para "João Pedro Silva"
- Slug é regenerado: `joao-pedro-silva`

### Cenário 3: Usuário Define Slug Personalizado
- Usuário define slug: `mentor-demo`
- Atualiza nome para "João Pedro Silva"
- Slug **permanece**: `mentor-demo` ✅

### Cenário 4: Usuário com Slug Personalizado Limpa o Slug
- Usuário tinha slug: `mentor-demo`
- Remove o slug (deixa vazio)
- Slug é regenerado automaticamente do nome

## Arquivo Modificado

- `supabase/migrations/20251028160000_fix_slug_override.sql`

## Como Testar

1. Acesse `/profile`
2. Defina um slug personalizado (ex: `meu-slug-legal`)
3. Clique em "Salvar Perfil"
4. Recarregue a página
5. Verifique que o slug permanece `meu-slug-legal` ✅
6. Altere seu nome
7. Salve novamente
8. Verifique que o slug ainda é `meu-slug-legal` ✅

## Migration Aplicada

```bash
npx supabase db push
```

Status: ✅ Aplicada com sucesso
