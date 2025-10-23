/**
 * Script para gerar Refresh Token do Google Calendar
 * 
 * Como usar:
 * 1. Adicione GOOGLE_CALENDAR_CLIENT_ID e GOOGLE_CALENDAR_CLIENT_SECRET no .env.local
 * 2. Execute: node scripts/generate-refresh-token.js
 * 3. Abra a URL gerada no navegador
 * 4. Faça login e autorize
 * 5. Copie o código da URL de callback
 * 6. Cole aqui no terminal
 * 7. Copie o refresh_token gerado e adicione no .env.local
 */

const { google } = require('googleapis');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

// Configuração
const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'http://localhost:3000/api/auth/google-calendar/callback';

// Validar variáveis
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ ERRO: Variáveis de ambiente não encontradas!');
  console.error('');
  console.error('Adicione no seu .env.local:');
  console.error('GOOGLE_CALENDAR_CLIENT_ID=seu_client_id');
  console.error('GOOGLE_CALENDAR_CLIENT_SECRET=seu_client_secret');
  console.error('GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/auth/google-calendar/callback');
  process.exit(1);
}

// Criar cliente OAuth2
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Scopes necessários
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.settings.readonly', // Para ler configurações
];

// Gerar URL de autorização
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent', // Força mostrar tela de consentimento para gerar refresh_token
  include_granted_scopes: true, // Inclui scopes já concedidos
});

console.log('');
console.log('🔐 GERADOR DE REFRESH TOKEN - Google Calendar');
console.log('='.repeat(60));
console.log('');
console.log('📋 Passo 1: Abra esta URL no navegador:');
console.log('');
console.log(authUrl);
console.log('');
console.log('📋 Passo 2: Faça login e autorize o aplicativo');
console.log('');
console.log('📋 Passo 3: Você será redirecionado para uma página de erro');
console.log('           (isso é normal, pois o servidor não está rodando)');
console.log('');
console.log('📋 Passo 4: Copie o CÓDIGO da URL de callback');
console.log('           A URL será algo como:');
console.log('           http://localhost:3000/api/auth/google-calendar/callback?code=CODIGO_AQUI');
console.log('');
console.log('📋 Passo 5: Cole o código abaixo e pressione ENTER');
console.log('');
console.log('='.repeat(60));
console.log('');

// Interface para ler input do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Cole o código aqui: ', async (code) => {
  try {
    console.log('');
    console.log('⏳ Trocando código por tokens...');
    
    // Trocar código por tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('');
    console.log('✅ SUCESSO! Tokens gerados:');
    console.log('='.repeat(60));
    console.log('');
    console.log('📝 Adicione estas linhas no seu .env.local:');
    console.log('');
    console.log(`GOOGLE_CALENDAR_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_CALENDAR_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_CALENDAR_REDIRECT_URI=${REDIRECT_URI}`);
    console.log(`GOOGLE_CALENDAR_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('');
    console.log('='.repeat(60));
    console.log('');
    console.log('⚠️  IMPORTANTE: Guarde o refresh_token em local seguro!');
    console.log('   Ele permite acesso ao Google Calendar sem precisar autorizar novamente.');
    console.log('');
    console.log('✅ Próximo passo: Reinicie o servidor e teste a integração');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERRO ao trocar código por tokens:');
    console.error(error.message);
    console.error('');
    console.error('💡 Dicas:');
    console.error('   - Verifique se copiou o código completo');
    console.error('   - O código expira rapidamente, gere um novo se necessário');
    console.error('   - Verifique se Client ID e Secret estão corretos');
    console.error('');
  } finally {
    rl.close();
  }
});
