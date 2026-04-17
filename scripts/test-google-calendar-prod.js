require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

async function testCalendar() {
  console.log('🚀 Iniciando teste de calendário...');
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'https://menvo.com.br/api/auth/google-calendar/callback'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    console.log('✅ Access token renovado com sucesso!');

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    console.log('📝 Criando evento de teste em:', calendarId);
    
    // Configura o evento
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const endTime = new Date(tomorrow);
    endTime.setHours(15, 0, 0, 0);

    const event = {
      summary: 'TESTE MENVO: Segurança',
      description: 'Validando integração sem chaves no código.',
      start: { dateTime: tomorrow.toISOString(), timeZone: 'America/Sao_Paulo' },
      end: { dateTime: endTime.toISOString(), timeZone: 'America/Sao_Paulo' },
      conferenceData: {
        createRequest: {
          requestId: `test-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: calendarId,
      conferenceDataVersion: 1,
      requestBody: event,
    });

    console.log('✅ SUCESSO! ID:', response.data.id);
    console.log('🔗 Meet:', response.data.hangoutLink);
    
  } catch (error) {
    console.error('❌ FALHA:', error.message);
  }
}

testCalendar();
