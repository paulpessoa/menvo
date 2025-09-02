import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/google-calendar';

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
    const tokens = await getTokensFromCode(code);
    
    // In a real implementation, you would save these tokens to the database
    // associated with the user's profile
    console.log('Google Calendar tokens received:', {
      access_token: tokens.access_token ? 'present' : 'missing',
      refresh_token: tokens.refresh_token ? 'present' : 'missing',
    });

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