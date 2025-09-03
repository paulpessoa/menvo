# Configuração de Variáveis de Ambiente na Vercel

## Variáveis Necessárias para Google Calendar

### 1. No Dashboard da Vercel:
1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá para "Settings" > "Environment Variables"
4. Adicione as seguintes variáveis:

```
GOOGLE_CALENDAR_CLIENT_ID=your_google_calendar_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_google_calendar_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=https://seu-dominio.vercel.app/api/auth/google-calendar/callback
```

> **Nota:** O `GOOGLE_CALENDAR_REFRESH_TOKEN` não é mais necessário pois os tokens são salvos no Supabase por usuário.

### 2. Importante:
- Mude o REDIRECT_URI para o domínio de produção
- Use o mesmo refresh_token obtido localmente
- Marque as variáveis como "Production", "Preview" e "Development" conforme necessário

### 3. Atualizar Google Cloud Console:
1. Acesse: https://console.cloud.google.com/
2. Vá para "APIs & Services" > "Credentials"
3. Edite suas credenciais OAuth 2.0
4. Adicione o URI de produção: `https://seu-dominio.vercel.app/api/auth/google-calendar/callback`

## Limitações:
- O refresh_token é estático
- Se expirar, precisa ser renovado manualmente
- Não é ideal para múltiplos usuários