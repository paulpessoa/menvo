const { google } = require('googleapis');
const readline = require('readline');

// Use environment variables for safety
const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'https://menvo.com.br/api/auth/google-calendar/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Erro: GOOGLE_CALENDAR_CLIENT_ID e GOOGLE_CALENDAR_CLIENT_SECRET devem estar no seu .env.local');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const scopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'
});

console.log('1. Abra este link no seu navegador:\n');
console.log(url);
console.log('\n2. Após autorizar, COPIE o código que aparece depois de "code=" na URL de retorno.');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\nCole o código aqui: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n✅ NOVO REFRESH TOKEN GERADO COM SUCESSO:\n');
    console.log(tokens.refresh_token);
  } catch (error) {
    console.error('\n❌ Erro ao gerar token:', error.message);
  }
  rl.close();
});
