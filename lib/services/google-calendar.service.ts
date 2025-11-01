/**
 * Google Calendar Service - Versão Unificada
 * Usa tokens globais de uma conta única para criar eventos
 * Baseado no script test-calendar-access.js que funcionou
 */

const { google } = require('googleapis');

// Validar variáveis de ambiente no startup
const REQUIRED_ENV_VARS = [
  'GOOGLE_CALENDAR_CLIENT_ID',
  'GOOGLE_CALENDAR_CLIENT_SECRET',
  'GOOGLE_CALENDAR_REFRESH_TOKEN',
];

const missingVars = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.warn('⚠️ Google Calendar não configurado. Variáveis faltando:', missingVars.join(', '));
}

/**
 * ID da agenda do Google Calendar
 * Se não especificado, usa 'primary' (agenda principal)
 * Para usar agenda específica "Menvo Mentorias", adicione no .env.local:
 * GOOGLE_CALENDAR_ID=seu_calendar_id@group.calendar.google.com
 */
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

/**
 * Criar cliente OAuth2 autenticado
 * EXATAMENTE como no script que funcionou
 */
async function createAuthenticatedClient() {
  console.log('🔍 [DEBUG] Criando cliente OAuth2...');

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    'http://localhost:3000/api/auth/google-calendar/callback'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
  });

  // Fazer refresh do token
  try {
    console.log('🔄 [DEBUG] Fazendo refresh do access token...');
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    console.log('✅ [DEBUG] Access token obtido com sucesso!');
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao fazer refresh:', error);
    throw new Error('Falha ao renovar access token');
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
    // Validar configuração
    if (missingVars.length > 0) {
      throw new Error('Google Calendar não configurado. Execute: node scripts/generate-refresh-token.js');
    }

    const oauth2Client = await createAuthenticatedClient();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    console.log('📝 [DEBUG] Criando evento no calendário...');

    // Criar evento EXATAMENTE como no script que funcionou
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

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      conferenceDataVersion: 1,
      requestBody: event,
    });

    const createdEvent = response.data;

    console.log('✅ [CALENDAR] Evento criado com sucesso!');
    console.log('   ID:', createdEvent.id);
    console.log('   Link:', createdEvent.htmlLink);
    console.log('   Meet:', createdEvent.hangoutLink);

    return {
      eventId: createdEvent.id || '',
      meetLink: createdEvent.hangoutLink || null,
      calendarLink: createdEvent.htmlLink || '',
    };

  } catch (error) {
    console.error('❌ [CALENDAR] Erro ao criar evento:', error);
    
    // Mensagens de erro mais amigáveis
    if (error instanceof Error) {
      if (error.message.includes('invalid_grant')) {
        throw new Error('Token do Google Calendar expirado. Execute: node scripts/generate-refresh-token.js');
      }
      if (error.message.includes('insufficient permissions')) {
        throw new Error('Permissões insuficientes. Verifique os scopes do OAuth.');
      }
    }
    
    throw error;
  }
}

/**
 * Atualizar evento existente
 */
export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<CalendarEventData>
): Promise<void> {
  try {
    if (missingVars.length > 0) {
      throw new Error('Google Calendar não configurado');
    }

    const oauth2Client = await createAuthenticatedClient();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const updateData: any = {};

    if (updates.summary) {
      updateData.summary = updates.summary;
    }

    if (updates.description) {
      updateData.description = updates.description;
    }

    if (updates.startTime && updates.endTime) {
      updateData.start = {
        dateTime: updates.startTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      };
      updateData.end = {
        dateTime: updates.endTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      };
    }

    await calendar.events.update({
      calendarId: CALENDAR_ID,
      eventId,
      sendUpdates: 'all',
      requestBody: updateData,
    });

    console.log('✅ [CALENDAR] Evento atualizado:', eventId);

  } catch (error) {
    console.error('❌ [CALENDAR] Erro ao atualizar evento:', error);
    throw error;
  }
}

/**
 * Deletar evento do calendário
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  try {
    if (missingVars.length > 0) {
      throw new Error('Google Calendar não configurado');
    }

    const oauth2Client = await createAuthenticatedClient();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId,
      sendUpdates: 'all', // Notifica participantes
    });

    console.log('✅ [CALENDAR] Evento deletado:', eventId);

  } catch (error) {
    console.error('❌ [CALENDAR] Erro ao deletar evento:', error);
    throw error;
  }
}

/**
 * Verificar se Google Calendar está configurado
 */
export function isGoogleCalendarConfigured(): boolean {
  return missingVars.length === 0;
}

/**
 * Obter variáveis faltando (para debug)
 */
export function getMissingEnvVars(): string[] {
  return missingVars;
}
