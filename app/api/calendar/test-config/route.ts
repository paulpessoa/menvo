import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export async function GET() {
  try {
    // Check environment variables
    const requiredEnvVars = [
      'GOOGLE_CALENDAR_CLIENT_ID',
      'GOOGLE_CALENDAR_CLIENT_SECRET',
      'GOOGLE_CALENDAR_REDIRECT_URI',
      'GOOGLE_CALENDAR_REFRESH_TOKEN',
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        missingVars,
        setup: {
          step1: 'Go to Google Cloud Console',
          step2: 'Enable Calendar API',
          step3: 'Create OAuth 2.0 credentials',
          step4: 'Set redirect URI to: https://your-domain.vercel.app/api/auth/google-calendar/callback',
          step5: 'Get authorization URL: GET /api/auth/google-calendar?action=auth',
          step6: 'Exchange code for tokens: POST /api/auth/google-calendar',
          step7: 'Add GOOGLE_CALENDAR_REFRESH_TOKEN to environment variables',
        },
      });
    }

    // Test OAuth2 client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      process.env.GOOGLE_CALENDAR_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
    });

    // Test calendar access
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const response = await calendar.calendarList.list({
      maxResults: 1,
    });

    return NextResponse.json({
      success: true,
      message: 'Google Calendar API is properly configured',
      calendars: response.data.items?.length || 0,
      primaryCalendar: response.data.items?.[0]?.summary || 'Not found',
    });

  } catch (error) {
    console.error('Error testing Google Calendar configuration:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to connect to Google Calendar API',
      details: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: {
        checkTokens: 'Verify that GOOGLE_CALENDAR_REFRESH_TOKEN is valid',
        reauthorize: 'Get new tokens using /api/auth/google-calendar',
        checkScopes: 'Ensure calendar and calendar.events scopes are granted',
      },
    });
  }
}