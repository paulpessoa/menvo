# Configuração do Google Calendar API

## Problema Atual
O erro "access_denied" indica que o app não foi verificado pelo Google ou você não está na lista de usuários de teste.

## Soluções

### Opção 1: Configurar como App Interno (Recomendado se você tem Google Workspace)
1. Acesse: https://console.cloud.google.com/
2. Vá para "APIs & Services" > "OAuth consent screen"
3. Mude o "User Type" de "External" para "Internal"
4. Salve as alterações

### Opção 2: Adicionar como Usuário de Teste
1. No OAuth consent screen, role até "Test users"
2. Clique em "ADD USERS"
3. Adicione seu email
4. Salve as alterações

### Opção 3: Criar um Novo Projeto (Mais Simples)
1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto
3. Ative a Google Calendar API
4. Crie credenciais OAuth 2.0
5. Configure a tela de consentimento como "Internal" ou adicione seu email como teste

## Após resolver o problema de acesso:

1. Execute: `node scripts/get-refresh-token.js`
2. Acesse a URL gerada
3. Complete o fluxo OAuth
4. Cole o código de autorização
5. Copie o refresh_token para o .env.stage

## Testando a Integração

Após obter o refresh_token:

1. Inicie o servidor: `npm run dev`
2. Acesse: `http://localhost:3000/test/calendar`
3. Clique em "Testar Integração"
4. Verifique se um evento de teste é criado no seu Google Calendar

## Variáveis de Ambiente Necessárias

\`\`\`env
# Configure essas variáveis na Vercel para produção
GOOGLE_CALENDAR_CLIENT_ID=seu_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=seu_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=https://seu-dominio.vercel.app/api/auth/google-calendar/callback
\`\`\`

> **Nota:** O `GOOGLE_CALENDAR_REFRESH_TOKEN` não é mais necessário pois os tokens são salvos no Supabase por usuário.
