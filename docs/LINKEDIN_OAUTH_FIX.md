# LinkedIn OAuth - Diagnóstico e Correção

## 🔍 Problema Identificado

O OAuth do LinkedIn não está funcionando. O código está configurado corretamente para usar `linkedin_oidc`, mas precisa verificar a configuração no Supabase Dashboard.

## ✅ Configuração Atual no Código

### Variáveis de Ambiente (.env, .env.local, .env.production)
```bash
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=WPL_AP1.your_linkedin_client_secret
```

### Provider Configurado
- **Provider no código**: `linkedin`
- **Provider no Supabase**: `linkedin_oidc` (OpenID Connect)
- **Scopes**: `['openid', 'profile', 'email']`

## 🔧 Passos para Corrigir no Supabase

### 1. Acessar Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto Menvo
3. Vá em: **Authentication** → **Providers**

### 2. Configurar LinkedIn (OIDC)

Procure por **LinkedIn (OIDC)** na lista de providers e configure:

#### ✅ Habilitar Provider
- [ ] Marque a opção **"Enable Sign in with LinkedIn"**

#### 🔑 Credenciais
```
Client ID: [seu-client-id-do-linkedin]
Client Secret: WPL_AP1.[seu-client-secret-do-linkedin]
```

**Nota**: Use os valores reais do seu arquivo `.env.local` (não commitar secrets!)

#### 🔄 Redirect URL
Copie a **Callback URL** fornecida pelo Supabase (algo como):
```
https://[seu-projeto].supabase.co/auth/v1/callback
```

### 3. Configurar no LinkedIn Developers

1. Acesse: https://www.linkedin.com/developers/apps
2. Selecione seu app ou crie um novo
3. Vá em **Auth** → **OAuth 2.0 settings**

#### Authorized redirect URLs
Adicione a URL de callback do Supabase:
```
https://[seu-projeto].supabase.co/auth/v1/callback
```

#### Scopes Necessários
Certifique-se que seu app tem os seguintes scopes habilitados:
- ✅ `openid`
- ✅ `profile`
- ✅ `email`

### 4. Verificar Configuração

Após configurar, teste o OAuth:

1. Acesse sua aplicação local: http://localhost:3000/login
2. Clique em "Continuar com LinkedIn"
3. Deve redirecionar para o LinkedIn
4. Após autorizar, deve retornar para `/auth/callback`

## 🐛 Troubleshooting

### Erro: "Invalid redirect URI"
**Causa**: URL de callback não está configurada no LinkedIn Developers

**Solução**:
1. Verifique se a URL do Supabase está em "Authorized redirect URLs"
2. Certifique-se que não há espaços ou caracteres extras
3. A URL deve ser EXATAMENTE como fornecida pelo Supabase

### Erro: "Invalid client credentials"
**Causa**: Client ID ou Secret incorretos

**Solução**:
1. Verifique se copiou corretamente do LinkedIn Developers
2. O Client Secret deve começar com `WPL_AP1.`
3. Regenere as credenciais se necessário

### Erro: "Insufficient permissions"
**Causa**: Scopes não configurados no LinkedIn app

**Solução**:
1. Vá em LinkedIn Developers → Products
2. Adicione "Sign In with LinkedIn using OpenID Connect"
3. Aguarde aprovação (pode ser instantânea)

### Erro: "Email not verified"
**Causa**: Email do usuário não está verificado no LinkedIn

**Solução**:
1. Usuário deve verificar email no LinkedIn
2. Ou configure o Supabase para aceitar emails não verificados (não recomendado)

## 📝 Checklist de Verificação

Antes de testar, confirme:

- [ ] LinkedIn provider está **habilitado** no Supabase
- [ ] Client ID e Secret estão **corretos** no Supabase
- [ ] Callback URL do Supabase está em **Authorized redirect URLs** no LinkedIn
- [ ] App do LinkedIn tem os **scopes** necessários (openid, profile, email)
- [ ] Produto "Sign In with LinkedIn using OpenID Connect" está **ativo**
- [ ] Variáveis de ambiente estão corretas no `.env.local`

## 🔗 Links Úteis

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth/social-login/auth-linkedin
- **LinkedIn Developers**: https://www.linkedin.com/developers/apps
- **LinkedIn OAuth 2.0**: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication

## 💡 Notas Importantes

1. **LinkedIn OIDC vs LinkedIn OAuth 2.0**:
   - Estamos usando **LinkedIn OIDC** (OpenID Connect)
   - É diferente do LinkedIn OAuth 2.0 tradicional
   - Requer o produto "Sign In with LinkedIn using OpenID Connect"

2. **Ambiente de Desenvolvimento**:
   - Para desenvolvimento local, adicione também:
   ```
   http://localhost:3000/auth/callback
   ```
   nas Authorized redirect URLs do LinkedIn

3. **Produção**:
   - Quando fizer deploy, adicione a URL de produção:
   ```
   https://menvo.com.br/auth/callback
   https://[seu-projeto-vercel].vercel.app/auth/callback
   ```

## 🚀 Próximos Passos

Após corrigir o LinkedIn OAuth:

1. Testar login com LinkedIn em desenvolvimento
2. Verificar se o perfil do usuário é criado corretamente
3. Testar em produção após deploy
4. Documentar qualquer configuração adicional necessária