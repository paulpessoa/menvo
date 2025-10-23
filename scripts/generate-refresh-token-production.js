/**
 * Script para gerar Refresh Token do Google Calendar - PRODUÇÃO
 * 
 * Como usar:
 * 1. Certifique-se de que adicionou a URI de produção no Google Cloud Console
 * 2. Execute: node scripts/generate-refresh-token-production.js
 * 3. Abra a URL gerada no navegador
 * 4. Faça login e autorize
 * 5. Copie o código da URL de callback
 * 6. Cole aqui no terminal
 * 7. Copie o refresh_token gerado e adicione na Vercel
 */

const { google } = require('googleapis');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

// Configuração - USAR VALORES DE PRODUÇÃO
const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
const REDIRECT_URI = 'https://menvo.com.br/setup/google-calendar/callback'; // URI DE PRODUÇÃO - Página que mostra o código

// Validar variáveis
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ ERRO: Variáveis de ambiente não encontradas!');
  console.error('');
  console.error('Adicione no seu .env.local:');
  console.error('GOOGLE_CALENDAR_CLIENT_ID=seu_client_id');
  console.error('GOOGLE_CALENDAR_CLIENT_SECRET=seu_client_secret');
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
  'https://www.googleapis.com/auth/calendar.settings.readonly',
];

// Gerar URL de autorização
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',
  include_granted_scopes: true,
});

console.log('');
console.log('🔐 GERADOR DE REFRESH TOKEN - PRODUÇÃO');
console.log('='.repeat(60));
console.log('');
console.log('⚠️  IMPORTANTE: Este token será usado em PRODUÇÃO!');
console.log('   Use a conta Google que você quer que crie os eventos.');
console.log('');
console.log('📋 Passo 1: Abra esta URL no navegador:');
console.log('');
console.log(authUrl);
console.log('');
console.log('📋 Passo 2: Faça login e autorize o aplicativo');
console.log('');
console.log('📋 Passo 3: Você será redirecionado para uma página que mostra o código');
console.log('           https://menvo.com.br/setup/google-calendar/callback');
console.log('');
console.log('📋 Passo 4: Clique no botão "Copiar" na página');
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
    console.log('✅ SUCESSO! Tokens de PRODUÇÃO gerados:');
    console.log('='.repeat(60));
    console.log('');
    console.log('📝 Adicione estas variáveis na VERCEL:');
    console.log('');
    console.log('   Acesse: https://vercel.com/seu-projeto/settings/environment-variables');
    console.log('');
    console.log('   Variável: GOOGLE_CALENDAR_CLIENT_ID');
    console.log(`   Valor: ${CLIENT_ID}`);
    console.log('');
    console.log('   Variável: GOOGLE_CALENDAR_CLIENT_SECRET');
    console.log(`   Valor: ${CLIENT_SECRET}`);
    console.log('');
    console.log('   Variável: GOOGLE_CALENDAR_REDIRECT_URI');
    console.log('   Valor: https://menvo.com.br/setup/google-calendar/callback');
    console.log('');
    console.log('   Variável: GOOGLE_CALENDAR_REFRESH_TOKEN');
    console.log(`   Valor: ${tokens.refresh_token}`);
    console.log('');
    console.log('='.repeat(60));
    console.log('');
    console.log('⚠️  IMPORTANTE: Guarde o refresh_token em local seguro!');
    console.log('');
    console.log('✅ Próximos passos:');
    console.log('   1. Adicione as variáveis na Vercel');
    console.log('   2. Faça redeploy do projeto');
    console.log('   3. Teste em: https://menvo.com.br/test/calendar');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERRO ao trocar código por tokens:');
    console.error(error.message);
    console.error('');
    console.error('💡 Dicas:');
    console.error('   - Verifique se copiou o código completo');
    console.error('   - O código expira rapidamente, gere um novo se necessário');
    console.error('   - Verifique se a URI de produção está configurada no Google Cloud Console');
    console.error('');
  } finally {
    rl.close();
  }
});
