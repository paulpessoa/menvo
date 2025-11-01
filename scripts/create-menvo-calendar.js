/**
 * Script para criar agenda "Menvo Mentorias" no Google Calendar
 * Execute: node scripts/create-menvo-calendar.js
 */

const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function createMenvoCalendar() {
  try {
    console.log('🔍 Criando agenda "Menvo Mentorias"...');

    // Criar cliente OAuth2
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      'http://localhost:3000/api/auth/google-calendar/callback'
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
    });

    // Fazer refresh do token
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Criar nova agenda
    const newCalendar = {
      summary: 'Menvo Mentorias',
      description: 'Agenda para eventos de mentoria da plataforma Menvo',
      timeZone: 'America/Sao_Paulo',
    };

    const response = await calendar.calendars.insert({
      requestBody: newCalendar,
    });

    console.log('✅ Agenda criada com sucesso!');
    console.log('📋 ID da agenda:', response.data.id);
    console.log('📝 Nome:', response.data.summary);
    console.log('');
    console.log('🔧 Adicione no seu .env.local:');
    console.log(`GOOGLE_CALENDAR_ID=${response.data.id}`);
    console.log('');
    console.log('💡 Agora atualize o código para usar esta agenda!');

  } catch (error) {
    console.error('❌ Erro ao criar agenda:', error.message);
    if (error.response) {
      console.error('Detalhes:', error.response.data);
    }
  }
}

createMenvoCalendar();
