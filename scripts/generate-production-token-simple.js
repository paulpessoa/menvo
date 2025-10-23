/**
 * Script SIMPLIFICADO para gerar Refresh Token - PRODUÇÃO
 * Usa URI que já está configurada no Google Cloud Console
 */

const { google } = require('googleapis');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;

// IMPORTANTE: Use uma URI que JÁ ESTÁ configurada no Google Cloud Console
// Opções que você provavelmente já tem:
const REDIRECT_URIS = [
  'https://menvo.com.br/auth/callback',
  'https://menvo.com.br/auth/userinfo.email',
  'https://menvo.com.br/auth/userinfo.profile',
  'http://localhost:3000/api/auth/google-calendar/callback',
];

console.log('🔐 GERADOR DE REFRESH TOKEN - PRODUÇÃO (Simplificado)');
console.log('='.repeat(70));
console.log('');
console.log('📋 Escolha qual URI usar (deve estar configurada no Google Console):');
console.log('');
REDIRECT_URIS.forEach((uri, index) => {
  console.log(`   ${index + 1}. ${uri}`);
});
console.log('');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Digite o número da URI (1-4): ', async (choice) => {
  const selectedUri = REDIRECT_URIS[parseInt(choice) - 1];
  
  if (!selectedUri) {
    console.error('❌ Opção inválida!');
    rl.close();
    return;
  }

  console.log('');
  console.log(`✅ Usando URI: ${selectedUri}`);
  console.log('');

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, selectedUri);

  const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('📋 Passo 1: Abra esta URL no navegador:');
  console.log('');
  console.log(authUrl);
  console.log('');
  console.log('📋 Passo 2: Autorize o app');
  console.log('📋 Passo 3: Copie o CÓDIGO da URL de callback');
  console.log('           (tudo depois de "code=")');
  console.log('');

  rl.question('Cole o código aqui: ', async (code) => {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      
      console.log('');
      console.log('✅ SUCESSO! Refresh Token gerado:');
      console.log('='.repeat(70));
      console.log('');
      console.log('📝 Adicione na Vercel:');
      console.log('');
      console.log('GOOGLE_CALENDAR_REFRESH_TOKEN=' + tokens.refresh_token);
      console.log('');
      console.log('='.repeat(70));
      
    } catch (error) {
      console.error('❌ Erro:', error.message);
    } finally {
      rl.close();
    }
  });
});
