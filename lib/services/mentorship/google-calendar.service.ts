import { google } from 'googleapis';

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
      const errorMsg = `Configuração do Google Calendar incompleta. Faltando: ${missing.join(', ')}`;
      console.error(`❌ [CALENDAR] ${errorMsg}`);
      throw new Error(errorMsg);
  }

  // Usando a forma recomendada para inicializar o cliente
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'https://menvo.com.br/api/auth/google-calendar/callback'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
  });

  try {
    console.log('🔄 [CALENDAR] Fazendo refresh do access token...');
    // refreshAccessToken é a forma padrão
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    console.log('✅ [CALENDAR] Access token obtido com sucesso!');
    return oauth2Client;
  } catch (error: any) {
    const detail = error.response?.data?.error_description || error.message || error;
    console.error('❌ [CALENDAR] Erro ao fazer refresh:', detail);
    
    if (detail === 'invalid_client') {
        throw new Error('Erro do Google: CLIENT_ID ou CLIENT_SECRET inválidos. Verifique na Vercel.');
    }
    
    throw new Error(`Falha ao renovar access token: ${detail}`);
  }
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

/**
 * Atualizar evento no Google Calendar
 */
export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  eventData: Partial<CalendarEventData>
) {
  try {
    const oauth2Client = await createAuthenticatedClient();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const updateBody: any = {};
    if (eventData.summary) updateBody.summary = eventData.summary;
    if (eventData.description) updateBody.description = eventData.description;
    if (eventData.startTime) updateBody.start = { dateTime: eventData.startTime.toISOString() };
    if (eventData.endTime) updateBody.end = { dateTime: eventData.endTime.toISOString() };

    const response = await calendar.events.patch({
      calendarId: getCalendarId(),
      eventId: eventId,
      requestBody: updateBody,
    });

    return response.data;
  } catch (error: any) {
    console.error('[CALENDAR] Erro ao atualizar evento:', error.message);
    throw error;
  }
}

/**
 * Excluir evento no Google Calendar
 */
export async function deleteCalendarEvent(
  userId: string,
  eventId: string
) {
  try {
    const oauth2Client = await createAuthenticatedClient();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: getCalendarId(),
      eventId: eventId,
    });

    return true;
  } catch (error: any) {
    // Silently ignore 404
    if (error.code === 404) return true;
    console.error('[CALENDAR] Erro ao deletar evento:', error.message);
    throw error;
  }
}
