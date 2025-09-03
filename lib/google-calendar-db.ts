import { supabase } from '@/lib/supabase';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleCalendarTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  is_expired: boolean;
}

/**
 * Salvar tokens do Google Calendar no Supabase
 */
export async function saveGoogleCalendarTokens(
  userId: string,
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope?: string;
  }
) {
  
  const { error } = await supabase.rpc('save_google_calendar_tokens', {
    p_user_id: userId,
    p_access_token: tokens.access_token,
    p_refresh_token: tokens.refresh_token,
    p_expires_in: tokens.expires_in,
    p_scope: tokens.scope || 'https://www.googleapis.com/auth/calendar'
  });

  if (error) {
    console.error('Error saving Google Calendar tokens:', error);
    throw new Error('Failed to save Google Calendar tokens');
  }
}

/**
 * Obter tokens do Google Calendar do Supabase
 */
export async function getGoogleCalendarTokens(userId: string): Promise<GoogleCalendarTokens | null> {
  
  const { data, error } = await supabase.rpc('get_google_calendar_tokens', {
    p_user_id: userId
  });

  if (error) {
    console.error('Error getting Google Calendar tokens:', error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return data[0];
}

/**
 * Criar cliente OAuth2 com tokens do usuário
 */
export async function createUserGoogleCalendarClient(userId: string) {
  const tokens = await getGoogleCalendarTokens(userId);
  
  if (!tokens) {
    throw new Error('User has not connected Google Calendar');
  }

  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  );

  // Se o token expirou, tenta renovar
  if (tokens.is_expired && tokens.refresh_token) {
    try {
      oauth2Client.setCredentials({
        refresh_token: tokens.refresh_token,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Salva os novos tokens
      if (credentials.access_token && credentials.expiry_date) {
        await saveGoogleCalendarTokens(userId, {
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || tokens.refresh_token,
          expires_in: Math.floor((credentials.expiry_date - Date.now()) / 1000),
        });
      }

      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error('Error refreshing Google Calendar token:', error);
      throw new Error('Failed to refresh Google Calendar token. Please reconnect.');
    }
  } else {
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
  }

  return {
    oauth2Client,
    calendar: google.calendar({ version: 'v3', auth: oauth2Client })
  };
}

/**
 * Verificar se o usuário tem Google Calendar conectado
 */
export async function hasGoogleCalendarConnected(userId: string): Promise<boolean> {
  const tokens = await getGoogleCalendarTokens(userId);
  return tokens !== null;
}

/**
 * Desconectar Google Calendar do usuário
 */
export async function disconnectGoogleCalendar(userId: string) {
  
  const { error } = await supabase
    .from('google_calendar_tokens')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Error disconnecting Google Calendar:', error);
    throw new Error('Failed to disconnect Google Calendar');
  }
}