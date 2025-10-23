import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { saveGoogleCalendarTokens } from '@/lib/google-calendar-db';
import { supabase } from '@/lib/supabase';

async function getTokensFromCode(code: string) {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw new Error('Failed to exchange authorization code');
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/mentor?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard/mentor?error=missing_code', request.url)
    );
  }

  try {
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        new URL('/auth/login?error=authentication_required', request.url)
      );
    }

    const tokens = await getTokensFromCode(code);
    
    console.log('🔑 Google Calendar tokens received:');
    console.log('   Access Token:', tokens.access_token ? 'present' : 'missing');
    console.log('   Refresh Token:', tokens.refresh_token ? 'present' : 'missing');
    
    // Salvar tokens no Supabase
    if (tokens.access_token && tokens.refresh_token && tokens.expiry_date) {
      const expiresIn = Math.floor((tokens.expiry_date - Date.now()) / 1000);
      
      await saveGoogleCalendarTokens(user.id, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: expiresIn,
        scope: tokens.scope
      });

      console.log('✅ Tokens saved to database for user:', user.id);
    }

    // Para desenvolvimento, ainda mostrar o refresh token no console
    if (tokens.refresh_token && process.env.NODE_ENV === 'development') {
      console.log('📋 COPY THIS REFRESH TOKEN TO YOUR .env.local:');
      console.log(`GOOGLE_CALENDAR_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log('');
    }

    return NextResponse.redirect(
      new URL('/dashboard/mentor?calendar_connected=true', request.url)
    );
  } catch (error) {
    console.error('Error in Google Calendar callback:', error);
    return NextResponse.redirect(
      new URL('/dashboard/mentor?error=token_exchange_failed', request.url)
    );
  }
}