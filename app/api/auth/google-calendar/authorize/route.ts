import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

function getAuthUrl(): string {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

export async function GET() {
  try {
    const authUrl = getAuthUrl();
    
    return NextResponse.json({ 
      success: true, 
      authUrl 
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate authorization URL' 
      },
      { status: 500 }
    );
  }
}