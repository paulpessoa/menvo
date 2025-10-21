/**
 * Google Calendar Service - Simplified for Mentor Interaction System
 * Cria eventos no Google Calendar do mentor após confirmação de agendamento
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { createClient } from '@/lib/supabase';

interface CalendarEventData {
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendeeEmail: string;
}

/**
 * Cria um evento no Google Calendar do mentor
 * @param mentorId - ID do mentor
 * @param eventData - Dados do evento
 * @returns ID do evento criado no Google Calendar
 */
export async function createCalendarEvent(
  mentorId: string,
  eventData: CalendarEventData
): Promise<string> {
  try {
    const supabase = createClient();

    // Buscar tokens OAuth do mentor no banco
    // TODO: Implementar tabela de tokens OAuth por usuário
    // Por enquanto, vamos usar tokens globais do .env
    
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // TODO: Buscar refresh_token do mentor no banco
    // Por enquanto, usar token global
    const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;
    
    if (!refreshToken) {
      console.error('[CALENDAR] Refresh token não configurado');
      throw new Error('Google Calendar não configurado');
    }

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Criar evento
    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: {
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
            email: eventData.attendeeEmail,
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
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 horas antes
            { method: 'popup', minutes: 60 }, // 1 hora antes
          ],
        },
      },
    });

    const eventId = response.data.id;
    
    if (!eventId) {
      throw new Error('Evento criado mas ID não retornado');
    }

    console.log('[CALENDAR] Evento criado com sucesso:', eventId);
    return eventId;
  } catch (error) {
    console.error('[CALENDAR] Erro ao criar evento:', error);
    throw error;
  }
}

/**
 * Atualiza um evento existente no Google Calendar
 */
export async function updateCalendarEvent(
  mentorId: string,
  eventId: string,
  eventData: Partial<CalendarEventData>
): Promise<void> {
  try {
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;
    
    if (!refreshToken) {
      throw new Error('Google Calendar não configurado');
    }

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const updateData: any = {};

    if (eventData.summary) {
      updateData.summary = eventData.summary;
    }

    if (eventData.description) {
      updateData.description = eventData.description;
    }

    if (eventData.startTime && eventData.endTime) {
      updateData.start = {
        dateTime: eventData.startTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      };
      updateData.end = {
        dateTime: eventData.endTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      };
    }

    await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: updateData,
    });

    console.log('[CALENDAR] Evento atualizado com sucesso:', eventId);
  } catch (error) {
    console.error('[CALENDAR] Erro ao atualizar evento:', error);
    throw error;
  }
}

/**
 * Deleta um evento do Google Calendar
 */
export async function deleteCalendarEvent(
  mentorId: string,
  eventId: string
): Promise<void> {
  try {
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;
    
    if (!refreshToken) {
      throw new Error('Google Calendar não configurado');
    }

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });

    console.log('[CALENDAR] Evento deletado com sucesso:', eventId);
  } catch (error) {
    console.error('[CALENDAR] Erro ao deletar evento:', error);
    throw error;
  }
}
