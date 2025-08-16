# Configuração OAuth - Google e LinkedIn

Este guia explica como configurar o login com Google e LinkedIn no seu projeto Next.js com Supabase.

## 📋 Resumo

**Dificuldade:** FÁCIL a MODERADA  
**Tempo estimado:** 30-45 minutos  
**Pré-requisitos:** Projeto Supabase ativo

## 🚀 Implementação no Código

✅ **JÁ IMPLEMENTADO** - O código já foi adicionado ao projeto:
- Métodos OAuth no `services/auth/supabase.ts`
- Botões funcionais nas páginas de login e signup
- Callback route configurado em `app/auth/callback/route.ts`

## ⚙️ Configurações Necessárias

### 1. Configuração no Supabase Dashboard

1. Acesse seu [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para **Authentication** → **Providers**
3. Configure os provedores:

#### Google:
- Ative o toggle **Google Enabled**
- Adicione **Client ID** e **Client Secret** (obtidos no passo 2)

#### LinkedIn:
- Ative o toggle **LinkedIn (OIDC) Enabled**
- Adicione **Client ID** e **Client Secret** (obtidos no passo 3)

### 2. Configuração Google Cloud Console

1. **Acesse o [Google Cloud Console](https://console.cloud.google.com/)**

2. **Crie/Selecione um projeto:**
   - Clique em "Select a project" → "New Project"
   - Nome: `volunteer-mentor-platform` (ou similar)

3. **Configure a tela de consentimento:**
   - Vá para **APIs & Services** → **OAuth consent screen**
   - Escolha **External** → **Create**
   - Preencha:
     - App name: `MENVO - Volunteer Mentors`
     - User support email: seu email
     - Developer contact: seu email
   - Em **Authorized domains**, adicione: `supabase.co`
   - Adicione os scopes:
     - `../auth/userinfo.email`
     - `../auth/userinfo.profile`
     - `openid`

4. **Crie credenciais OAuth:**
   - Vá para **APIs & Services** → **Credentials**
   - Clique **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `MENVO - Volunteer Mentors`
   
   **Authorized JavaScript origins:**
   \`\`\`
   http://localhost:3000
   https://seu-dominio.com
   \`\`\`
   
   **Authorized redirect URIs:**
   \`\`\`
   https://SEU-PROJECT-REF.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   \`\`\`

5. **Copie as credenciais:**
   - **Client ID** e **Client Secret**
   - Cole no Supabase Dashboard (passo 1)

### 3. Configuração LinkedIn Developer

1. **Acesse o [LinkedIn Developer Dashboard](https://www.linkedin.com/developers/)**

2. **Crie uma aplicação:**
   - Clique **Create App**
   - App name: `MENVO - Volunteer Mentors`
   - LinkedIn Page: Sua página/empresa
   - App logo: Upload de um logo

3. **Configure produtos:**
   - Vá para **Products**
   - Encontre **Sign In with LinkedIn using OpenID Connect**
   - Clique **Request Access**

4. **Configure autenticação:**
   - Vá para **Auth**
   - Em **Authorized Redirect URLs**, adicione:
   \`\`\`
   https://SEU-PROJECT-REF.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   \`\`\`

5. **Verifique os scopes:**
   - Certifique-se que estão marcados:
     - `openid`
     - `profile`
     - `email`

6. **Copie as credenciais:**
   - **Client ID** e **Client Secret**
   - Cole no Supabase Dashboard (passo 1)

### 4. Configuração para Desenvolvimento Local

Se você estiver usando Supabase CLI localmente, adicione ao `supabase/config.toml`:

\`\`\`toml
[auth.external.google]
enabled = true
client_id = "seu-google-client-id"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"

[auth.external.linkedin_oidc]
enabled = true
client_id = "seu-linkedin-client-id"
secret = "env(SUPABASE_AUTH_EXTERNAL_LINKEDIN_SECRET)"
\`\`\`

E no seu `.env.local`:
\`\`\`env
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=seu-google-client-secret
SUPABASE_AUTH_EXTERNAL_LINKEDIN_SECRET=seu-linkedin-client-secret
\`\`\`

## 🔧 URLs de Callback

**Produção:**
\`\`\`
https://SEU-PROJECT-REF.supabase.co/auth/v1/callback
\`\`\`

**Desenvolvimento:**
\`\`\`
http://localhost:3000/auth/callback
\`\`\`

## ✅ Testando a Implementação

1. **Inicie o servidor de desenvolvimento:**
   \`\`\`bash
   npm run dev
   \`\`\`

2. **Acesse a página de login:**
   \`\`\`
   http://localhost:3000/login
   \`\`\`

3. **Teste os botões OAuth:**
   - Clique em "Continue with Google"
   - Clique em "Continue with LinkedIn"

4. **Verifique no Supabase Dashboard:**
   - Vá para **Authentication** → **Users**
   - Confirme que novos usuários aparecem após login OAuth

## 🚨 Problemas Comuns

### Erro: "redirect_uri_mismatch"
- Verifique se as URLs de callback estão corretas
- Certifique-se que não há espaços extras nas URLs

### Erro: "invalid_client"
- Verifique se Client ID e Secret estão corretos
- Confirme que copiou as credenciais completas

### LinkedIn: "unauthorized_client"
- Certifique-se que solicitou acesso ao "Sign In with LinkedIn using OpenID Connect"
- Aguarde aprovação (pode levar algumas horas)

### Desenvolvimento local não funciona
- Adicione `http://localhost:3000` nas origens autorizadas
- Use `127.0.0.1:3000` se `localhost` não funcionar

## 📝 Próximos Passos

Após configurar OAuth:

1. **Teste em produção** após deploy
2. **Configure domínio customizado** no Supabase (opcional)
3. **Adicione GitHub OAuth** seguindo padrão similar
4. **Implemente logout** em todas as páginas necessárias

## 🔗 Links Úteis

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [LinkedIn OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-linkedin)
- [Google Cloud Console](https://console.cloud.google.com/)
- [LinkedIn Developer Portal](https://www.linkedin.com/developers/)

---

**Dúvidas?** Consulte a documentação oficial ou abra uma issue no repositório.
