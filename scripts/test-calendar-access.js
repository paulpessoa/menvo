/**
 * Script para testar acesso ao Google Calendar
 * Testa se consegue listar calendários e criar eventos
 */

const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function testCalendarAccess() {
  console.log('🧪 Testando acesso ao Google Calendar...\n');

  // Verificar variáveis
  const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.error('❌ Variáveis de ambiente faltando!');
    return;
  }

  console.log('✅ Variáveis de ambiente carregadas');
  console.log(`   CLIENT_ID: ${CLIENT_ID.substring(0, 20)}...`);
  console.log(`   REFRESH_TOKEN: ${REFRESH_TOKEN.substring(0, 20)}...\n`);

  // Criar cliente OAuth2
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'http://localhost:3000/api/auth/google-calendar/callback'
  );

  oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN,
  });

  // Tentar fazer refresh
  try {
    console.log('🔄 Fazendo refresh do access token...');
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    console.log('✅ Access token obtido com sucesso!\n');
  } catch (error) {
    console.error('❌ Erro ao fazer refresh:', error.message);
    return;
  }

  // Criar cliente do Calendar
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Teste 1: Listar calendários
  try {
    console.log('📋 Teste 1: Listando calendários...');
    const calendarList = await calendar.calendarList.list();
    const calendars = calendarList.data.items || [];
    
    console.log(`✅ Encontrados ${calendars.length} calendários:\n`);
    
    calendars.forEach((cal, index) => {
      console.log(`   ${index + 1}. ${cal.summary}`);
      console.log(`      ID: ${cal.id}`);
      console.log(`      Access Role: ${cal.accessRole}`);
      console.log(`      Primary: ${cal.primary || false}\n`);
    });
  } catch (error) {
    console.error('❌ Erro ao listar calendários:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    return;
  }

  // Teste 2: Criar evento de teste
  try {
    console.log('📝 Teste 2: Criando evento de teste...');
    
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hora a partir de agora
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 horas a partir de agora

    const event = {
      summary: '🧪 Teste - Script Node.js',
      description: 'Evento de teste criado diretamente via script Node.js',
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      conferenceDataVersion: 1,
      requestBody: event,
    });

    console.log('✅ Evento criado com sucesso!');
    console.log(`   ID: ${response.data.id}`);
    console.log(`   Link: ${response.data.htmlLink}`);
    console.log(`   Meet: ${response.data.hangoutLink || 'Não gerado'}\n`);

    console.log('🎉 SUCESSO! A integração está funcionando!');
    console.log('   Você pode deletar o evento de teste no Google Calendar.');

  } catch (error) {
    console.error('❌ Erro ao criar evento:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Status Text:', error.response.statusText);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('\n💡 Possíveis causas:');
    console.error('   - A conta não tem permissão para criar eventos');
    console.error('   - O refresh_token foi gerado com scopes insuficientes');
    console.error('   - O calendário "primary" não existe ou não está acessível');
  }
}

testCalendarAccess().catch(console.error);
