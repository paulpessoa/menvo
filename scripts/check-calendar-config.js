require('dotenv').config({ path: '.env.local' });

const REQUIRED_ENV_VARS = [
  'GOOGLE_CALENDAR_CLIENT_ID',
  'GOOGLE_CALENDAR_CLIENT_SECRET',
  'GOOGLE_CALENDAR_REFRESH_TOKEN',
];

console.log('--- Checking Google Calendar Config ---');
let allOk = true;

REQUIRED_ENV_VARS.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Configurado (tamanho: ${value.length})`);
  } else {
    console.log(`❌ ${varName}: FALTANDO`);
    allOk = false;
  }
});

if (allOk) {
  console.log('\n🚀 Configuração parece correta no .env.local!');
} else {
  console.log('\n⚠️ Algumas variáveis estão faltando. O Google Meet não será gerado até que todas estejam no .env do servidor de produção.');
}
