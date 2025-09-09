# Instruções para Resolver o Erro de Verificação do Google

## Problema
Erro 403: access_denied - "Menvo não concluiu o processo de verificação do Google"

## Soluções

### Opção 1: Configurar como App Interno (Mais Rápido)
1. Acesse: https://console.cloud.google.com/
2. Selecione seu projeto
3. Vá para "APIs & Services" > "OAuth consent screen"
4. Mude "User Type" de "External" para "Internal"
5. Salve as alterações

### Opção 2: Adicionar como Usuário de Teste
1. No OAuth consent screen, role até "Test users"
2. Clique em "ADD USERS"
3. Adicione seu email: [seu_email_aqui]
4. Salve as alterações

### Opção 3: Criar um Novo Projeto (Recomendado)
1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto para testes
3. Ative a Google Calendar API
4. Crie credenciais OAuth 2.0:
   - Tipo de aplicação: Web application
   - Nome: Menvo Calendar Test
   - URIs de redirecionamento autorizados: http://localhost:3000/api/auth/google-calendar/callback
5. Configure a tela de consentimento como "Internal" ou adicione seu email como usuário de teste

## Após resolver o problema:

### Usando a Interface Web:
1. Acesse: http://localhost:3000/test/calendar
2. Clique em "Autorizar Google Calendar"
3. Complete o fluxo OAuth
4. O refresh_token aparecerá no console do servidor

### Usando o Script:
1. Execute: `node scripts/get-refresh-token.js`
2. Acesse a URL gerada
3. Complete o fluxo OAuth
4. Cole o código de autorização
5. Copie o refresh_token

## Atualizando o .env.stage:
Após obter o refresh_token, adicione-o ao arquivo .env.stage:

\`\`\`
# Não é mais necessário configurar GOOGLE_CALENDAR_REFRESH_TOKEN
# Os tokens são salvos automaticamente no Supabase por usuário
\`\`\`

## Testando:
1. Reinicie o servidor: `npm run dev`
2. Acesse: http://localhost:3000/test/calendar
3. Clique em "Testar Integração"
4. Verifique se um evento de teste é criado no Google Calendar
