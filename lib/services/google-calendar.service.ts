/**
 * Google Calendar Service - Versão Unificada
 * Usa tokens globais de uma conta única para criar eventos
 */

const { google } = require('googleapis');

/**
 * ID da agenda do Google Calendar
 * Se não especificado, usa 'primary' (agenda principal)
 */
const getCalendarId = () => process.env.GOOGLE_CALENDAR_ID || 'primary';

/**
 * Obter variáveis faltando (para debug)
 */
export function getMissingEnvVars() {
  const REQUIRED_ENV_VARS = [
    'GOOGLE_CALENDAR_CLIENT_ID',
    'GOOGLE_CALENDAR_CLIENT_SECRET',
    'GOOGLE_CALENDAR_REFRESH_TOKEN',
  ];
  return REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);
}

/**
 * Criar cliente OAuth2 autenticado
 */
async function createAuthenticatedClient() {
  console.log('🔍 [CALENDAR] Criando cliente OAuth2...');

  const missing = getMissingEnvVars();
  if (missing.length > 0) {
      throw new Error(`Configuração do Google Calendar incompleta. Faltando: ${missing.join(', ')}`);
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'https://menvo.com.br/api/auth/google-calendar/callback'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
  });

  // Fazer refresh do token
  try {
    console.log('🔄 [CALENDAR] Fazendo refresh do access token...');
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    console.log('✅ [CALENDAR] Access token obtido com sucesso!');
  } catch (error: any) {
    console.error('❌ [CALENDAR] Erro ao fazer refresh:', error.message || error);
    throw new Error(`Falha ao renovar access token: ${error.message || 'Erro desconhecido'}`);
  }

  return oauth2Client;
}

/**
 * Interface para dados do evento
 */
export interface CalendarEventData {
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
  mentorEmail: string;
  mentorName: string;
  menteeEmail: string;
  menteeName: string;
}

/**
 * Interface para resposta da criação do evento
 */
export interface CalendarEventResponse {
  eventId: string;
  meetLink: string | null;
  calendarLink: string;
}

/**
 * Criar evento no Google Calendar com Google Meet
 */
export async function createCalendarEvent(
  eventData: CalendarEventData
): Promise<CalendarEventResponse> {
  try {
    const oauth2Client = await createAuthenticatedClient();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    console.log('📝 [CALENDAR] Preparando payload do evento...');

    const event = {
      summary: eventData.summary,
      description: eventData.description,
      start: {
        dateTime: eventData.startTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: eventData.endTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      attendees: [
        {
          email: eventData.mentorEmail,
          displayName: eventData.mentorName,
        },
        {
          email: eventData.menteeEmail,
          displayName: eventData.menteeName,
        },
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    };

    console.log('🚀 [CALENDAR] Chamando insert no Google API...');

    const response = await calendar.events.insert({
      calendarId: getCalendarId(),
      conferenceDataVersion: 1,
      requestBody: event,
    });

    const createdEvent = response.data;

    console.log('✅ [CALENDAR] Evento criado no Google. ID:', createdEvent.id);
    
    return {
      eventId: createdEvent.id || '',
      meetLink: createdEvent.hangoutLink || null,
      calendarLink: createdEvent.htmlLink || '',
    };

  } catch (error: any) {
    console.error('❌ [CALENDAR] Erro na criação do evento:', error.message || error);
    
    if (error.response?.data) {
        console.error('📦 [CALENDAR] Resposta detalhada do Google:', JSON.stringify(error.response.data));
    }
    
    throw error;
  }
}

/**
 * Verificar se Google Calendar está configurado
 */
export function isGoogleCalendarConfigured(): boolean {
  return getMissingEnvVars().length === 0;
}

// Manter outras funções vazias para não quebrar imports
export async function updateCalendarEvent() {}
export async function deleteCalendarEvent() {}
