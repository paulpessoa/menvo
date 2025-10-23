/**
 * Script para gerar Refresh Token - Funciona com qualquer URI configurada
 * 
 * Como usar:
 * 1. Execute: node scripts/generate-refresh-token-any-uri.js
 * 2. Escolha qual URI usar (das que você já tem configuradas)
 * 3. Abra a URL gerada no navegador
 * 4. Faça login e autorize
 * 5. Copie o código da URL de callback
 * 6. Cole aqui no terminal
 */

const { google } = require('googleapis');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ ERRO: Variáveis de ambiente não encontradas!');
  process.exit(1);
}

// URIs disponíveis (baseado na imagem que você mostrou)
const AVAILABLE_URIS = [
  'https://menvo.com.br/auth/userinfo.email',
  'https://menvo.com.br',
  'https://evxrzmzkghshjmmyegxu.supabase.co',
  'https://menvo.com.br/auth/userinfo.profile',
  'https://evxrzmzkghshjmmyegxu.supabase.co/auth/v1/callback',
  'https://menvo.com.br/api/auth/google-calendar/callback',
  'http://localhost:3000/api/auth/google-calendar/callback',
  'http://localhost:3000/api/calendar/test',
];

console.log('');
console.log('🔐 GERADOR DE REFRESH TOKEN - Universal');
console.log('='.repeat(60));
console.log('');
console.log('📋 URIs disponíveis no seu Google Cloud Console:');
console.log('');

AVAILABLE_URIS.forEach((uri, index) => {
  console.log(`   ${index + 1}. ${uri}`);
});

console.log('');
console.log('💡 Dica: Use a URI 6 ou 7 para desenvolvimento');
console.log('         Use a URI 6 para produção (se já estiver configurada)');
console.log('');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Escolha o número da URI (1-8): ', (choice) => {
  const index = parseInt(choice) - 1;
  
  if (index < 0 || index >= AVAILABLE_URIS.length) {
    console.error('❌ Escolha inválida!');
    rl.close();
    return;
  }

  const REDIRECT_URI = AVAILABLE_URIS[index];
  
  console.log('');
  console.log(`✅ Usando URI: ${REDIRECT_URI}`);
  console.log('');

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.settings.readonly',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    include_granted_scopes: true,
  });

  console.log('📋 Passo 1: Abra esta URL no navegador:');
  console.log('');
  console.log(authUrl);
  console.log('');
  console.log('📋 Passo 2: Faça login e autorize');
  console.log('');
  console.log('📋 Passo 3: Copie o CÓDIGO da URL de callback');
  console.log('           (tudo depois de "code=")');
  console.log('');

  rl.question('Cole o código aqui: ', async (code) => {
    try {
      console.log('');
      console.log('⏳ Trocando código por tokens...');
      
      const { tokens } = await oauth2Client.getToken(code);
      
      console.log('');
      console.log('✅ SUCESSO! Tokens gerados:');
      console.log('='.repeat(60));
      console.log('');
      console.log('📝 Para PRODUÇÃO (Vercel):');
      console.log('');
      console.log('GOOGLE_CALENDAR_CLIENT_ID=' + CLIENT_ID);
      console.log('GOOGLE_CALENDAR_CLIENT_SECRET=' + CLIENT_SECRET);
      console.log('GOOGLE_CALENDAR_REDIRECT_URI=' + REDIRECT_URI);
      console.log('GOOGLE_CALENDAR_REFRESH_TOKEN=' + tokens.refresh_token);
      console.log('');
      console.log('='.repeat(60));
      console.log('');
      
    } catch (error) {
      console.error('');
      console.error('❌ ERRO:', error.message);
      console.error('');
    } finally {
      rl.close();
    }
  });
});
