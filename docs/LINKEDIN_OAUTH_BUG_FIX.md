# LinkedIn OAuth - Bug Fix

## 🐛 Problema Identificado

O LinkedIn OAuth parou de funcionar após as mudanças de hoje. A causa raiz foi identificada no arquivo [`lib/auth/auth-context.tsx`](../lib/auth/auth-context.tsx:125).

## 🔍 Causa Raiz

### Código Problemático (ANTES)
```typescript
const signInWithProvider = async (provider: Provider) => {
    try {
        setLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider,  // ❌ PROBLEMA: Passa 'linkedin' diretamente
            options: { redirectTo: `${window.location.origin}/auth/callback` }
        })
        if (error) throw error
        return { success: true }
    } catch (error) { 
        return { success: false, error } 
    } finally { 
        setLoading(false) 
    }
}
```

**Problema**: O código estava passando `provider` diretamente para o Supabase, mas:
- Para LinkedIn, o Supabase requer `linkedin_oidc` (não `linkedin`)
- O projeto já tinha uma função [`signInWithOAuthProvider`](../lib/auth/oauth-provider-fixes.ts:88) que faz esse mapeamento corretamente
- Essa função não estava sendo usada no `auth-context.tsx`

## ✅ Solução Implementada

### Código Corrigido (DEPOIS)
```typescript
import { signInWithOAuthProvider } from '@/lib/auth/oauth-provider-fixes'

const signInWithProvider = async (provider: Provider) => {
    try {
        setLoading(true)
        
        // Only support google, linkedin, and github
        if (provider !== 'google' && provider !== 'linkedin' && provider !== 'github') {
            throw new Error(`Provider ${provider} not supported`)
        }
        
        // ✅ SOLUÇÃO: Usa a função que mapeia linkedin -> linkedin_oidc
        const result = await signInWithOAuthProvider(supabase, provider, {
            redirectTo: `${window.location.origin}/auth/callback`
        })
        if (result.error) throw result.error
        
        // Redirect to the OAuth URL
        if (result.data?.url) {
            window.location.href = result.data.url
        }
        
        return { success: true }
    } catch (error) {
        console.error('OAuth sign-in error:', error)
        return { success: false, error }
    } finally {
        setLoading(false)
    }
}
```

## 🔧 Mudanças Realizadas

1. **Import adicionado**: `signInWithOAuthProvider` de `oauth-provider-fixes.ts`
2. **Validação de provider**: Apenas google, linkedin e github são suportados
3. **Uso da função correta**: `signInWithOAuthProvider` que faz o mapeamento:
   - `linkedin` → `linkedin_oidc`
   - `google` → `google`
   - `github` → `github`

## 📝 Mapeamento de Providers

A função [`getOAuthConfig`](../lib/auth/oauth-provider-fixes.ts:40) em `oauth-provider-fixes.ts` define:

```typescript
{
  linkedin: {
    provider: 'linkedin',
    supabaseProvider: 'linkedin_oidc',  // ← Mapeamento correto
    scopes: ['openid', 'profile', 'email'],
    queryParams: {
      prompt: 'consent'
    }
  }
}
```

## ✅ Verificações no Supabase

Mesmo com o código corrigido, você deve verificar no Supabase Dashboard:

### 1. Provider Habilitado
- Acesse: **Authentication** → **Providers**
- Procure: **LinkedIn (OIDC)**
- Status: Deve estar **habilitado** (toggle verde)

### 2. Credenciais Configuradas
```
Client ID: [seu-client-id]
Client Secret: WPL_AP1.[seu-secret]
```

### 3. Callback URL
Copie a URL de callback do Supabase (algo como):
```
https://[seu-projeto].supabase.co/auth/v1/callback
```

### 4. LinkedIn Developers
Acesse: https://www.linkedin.com/developers/apps

**Authorized redirect URLs** deve incluir:
```
https://[seu-projeto].supabase.co/auth/v1/callback
http://localhost:3000/auth/callback  (para desenvolvimento)
```

**Scopes necessários**:
- ✅ `openid`
- ✅ `profile`
- ✅ `email`

**Produto necessário**:
- ✅ "Sign In with LinkedIn using OpenID Connect" (deve estar ativo)

## 🧪 Como Testar

1. Acesse: http://localhost:3000/login
2. Clique em "Continuar com LinkedIn"
3. Deve redirecionar para LinkedIn
4. Após autorizar, deve retornar para `/auth/callback`
5. Deve criar/atualizar perfil e redirecionar para dashboard

## 📊 Logs para Debug

O código agora inclui logs detalhados:

```typescript
console.log(`🔄 Starting OAuth with ${provider}...`)
console.log(`   Provider: ${config.supabaseProvider}`)
console.log(`   Redirect: ${redirectTo}`)
console.log(`   Options:`, JSON.stringify(oauthOptions, null, 2))
```

Se houver erro:
```typescript
console.error(`❌ OAuth error for ${provider}:`, error)
```

## 🎯 Resultado Esperado

Após a correção:
- ✅ LinkedIn OAuth deve funcionar novamente
- ✅ Google OAuth continua funcionando
- ✅ GitHub OAuth continua funcionando
- ✅ Mapeamento correto de providers
- ✅ Logs detalhados para debug

## 📚 Arquivos Modificados

- [`lib/auth/auth-context.tsx`](../lib/auth/auth-context.tsx:1) - Corrigido para usar `signInWithOAuthProvider`

## 📚 Arquivos Relacionados

- [`lib/auth/oauth-provider-fixes.ts`](../lib/auth/oauth-provider-fixes.ts:1) - Função de mapeamento de providers
- [`lib/auth/oauth-config-validator.ts`](../lib/auth/oauth-config-validator.ts:1) - Validação de configuração
- [`app/auth/callback/route.ts`](../app/auth/callback/route.ts:1) - Handler de callback OAuth

## 💡 Lições Aprendidas

1. **Sempre use funções de abstração**: A função `signInWithOAuthProvider` já existia e resolvia o problema
2. **LinkedIn requer OIDC**: Não é OAuth 2.0 tradicional, é OpenID Connect
3. **Mapeamento de providers**: Cada provider pode ter nome diferente no Supabase
4. **Logs são essenciais**: Facilitam debug de problemas de OAuth

## 🚀 Próximos Passos

1. Aguardar build completar
2. Testar login com LinkedIn em desenvolvimento
3. Verificar se perfil é criado corretamente
4. Fazer commit da correção
5. Testar em produção após deploy