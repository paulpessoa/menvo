# Guia de Configuração de Email - Supabase

## Problema Identificado

O link de confirmação de email está sendo "wrappado" por um serviço de tracking de email, quebrando o fluxo PKCE do Supabase.

**Link atual (com tracking):**
```
https://icjhfei.r.af.d.sendibt2.com/tr/cl/yEKikj0lC_Tx_6_G9w2DZb6VQVIi6gFoWotTvfrfP-2LvDmFTmcerDIrKNnEzouF25da76TzbNoZ6AsVr7D0LpnykLQRKw8oy4RZGHIgk120NZhXKTXDfA5Sq3apIW1ucDo9fbc5MNvGvNPO5P_AXVOeApvMCnfbmCvo2NW-M47WH_MvzboM_P9IW2l42hbE65MnE2tPFvf8ETcGmi2FQrcIp29sVWLJsi3cYrEbxv0Hy1B0KnCT984sljz4HLzw_mL01mauMOV_-6usvTOXMny6aZc-kdmYx6tVtsrnExvH9O6-pqc8FQnVhDXSkQVDIoQg4If2lLP5gNrNmapQ17YVbcuPwPI98Q_RVY3x1JOTws96-1vqtHO2B6eeg3vz-3EY7hringrMQ6J3h-C6FSHjn9sIDUWCcTCsDEJiWnk5RAVABIau89LYhzT6GuCiYlpiN9F-Gxx54cXUXOK1pOXUKv17e1TnJ47Pxx66jxr7lpIRu8UOIFePj30FNyQ7Wtm9F2q14foxEjBLV0cYIYVdprjImz2DEb_YL6yZKkMyUu1MfaYPaMIJyKMvpVIquando
```

**Link esperado (direto do Supabase):**
```
https://menvo.com.br/auth/callback?code=CODIGO_REAL&type=signup
```

## Soluções

### Solução 1: Desabilitar Link Tracking (Recomendado)

#### No Supabase Dashboard:

1. **Acesse Authentication > Settings > SMTP Settings**
2. **Se estiver usando SMTP customizado:**
   - Verifique se o provedor (SendGrid, Mailgun, etc.) tem link tracking habilitado
   - Desabilite o link tracking nas configurações do provedor
3. **Se estiver usando SMTP padrão do Supabase:**
   - Mude para SMTP customizado sem tracking

#### Configuração SendGrid (se aplicável):
```json
{
  "tracking_settings": {
    "click_tracking": {
      "enable": false
    },
    "open_tracking": {
      "enable": false
    }
  }
}
```

### Solução 2: Usar SMTP Simples

#### Configurar SMTP sem tracking:

**Opções recomendadas:**
- **Postmark** (sem tracking por padrão)
- **Amazon SES** (configurável)
- **SMTP simples** (Gmail, Outlook)

#### Configuração no Supabase:
1. **Authentication > Settings > SMTP Settings**
2. **Enable custom SMTP**: ON
3. **Configurar:**
   ```
   SMTP Host: smtp.postmarkapp.com
   SMTP Port: 587
   SMTP User: [seu_token]
   SMTP Pass: [seu_token]
   SMTP Sender Name: Menvo
   SMTP Sender Email: noreply@menvo.com.br
   ```

### Solução 3: Teste Temporário

#### Para testar imediatamente:

1. **Clique no link do email atual**
2. **Veja para onde ele redireciona** (pode funcionar após o redirecionamento)
3. **Se não funcionar, copie o link final** e substitua o domínio

#### Exemplo de conversão manual:
Se o link final for algo como:
```
https://projeto.supabase.co/auth/v1/verify?token=TOKEN&type=signup&redirect_to=https://menvo.com.br/auth/callback
```

Acesse diretamente:
```
https://menvo.com.br/auth/callback?code=TOKEN&type=signup
```

## Verificações no Dashboard

### 1. Authentication > Settings
- ✅ **Enable email confirmations**: ON
- ✅ **Enable email change confirmations**: ON
- ✅ **Secure email change**: ON

### 2. Authentication > Email Templates
- ✅ **Confirm signup** template ativo
- ✅ **Sem modificações que adicionem tracking**

### 3. Authentication > SMTP Settings
- ❌ **Se usando provedor com tracking**: Desabilitar
- ✅ **Se usando provedor sem tracking**: Manter

## Teste da Correção

### 1. Fazer novo cadastro
```bash
# Usar email de teste
teste+$(date +%s)@seudominio.com
```

### 2. Verificar link recebido
- Deve ser direto para seu domínio
- Deve ter parâmetros `code` e `type=signup`

### 3. Testar fluxo completo
- Clicar no link
- Deve ir para `/auth/confirmed`
- Deve mostrar mensagem de boas-vindas
- Deve redirecionar automaticamente

## Configuração de Produção Recomendada

### Postmark (Recomendado)
```env
SMTP_HOST=smtp.postmarkapp.com
SMTP_PORT=587
SMTP_USER=seu_server_token
SMTP_PASS=seu_server_token
SMTP_SENDER_NAME=Menvo
SMTP_SENDER_EMAIL=noreply@menvo.com.br
```

**Vantagens:**
- Sem link tracking por padrão
- Alta deliverability
- Fácil configuração
- Logs detalhados

### Amazon SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=seu_access_key
SMTP_PASS=seu_secret_key
SMTP_SENDER_NAME=Menvo
SMTP_SENDER_EMAIL=noreply@menvo.com.br
```

**Configuração adicional:**
- Desabilitar tracking nas configurações SES
- Configurar domínio verificado

## Próximos Passos

1. **Imediato**: Clique no link atual e veja se funciona após redirecionamento
2. **Curto prazo**: Configure SMTP sem tracking
3. **Longo prazo**: Monitore deliverability e ajuste conforme necessário

## Suporte

Se precisar de ajuda:
1. Execute o script `scripts/check_supabase_email_config.sql`
2. Verifique as configurações no Dashboard
3. Teste com email de desenvolvimento primeiro