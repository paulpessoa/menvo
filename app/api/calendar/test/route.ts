import { NextRequest, NextResponse } from 'next/server';
import { createCalendarEvent, CalendarEvent } from '@/lib/google-calendar';

export async function POST(request: NextRequest) {
  try {
    // Test event data
    const testEvent: CalendarEvent = {
      summary: 'Test Mentorship Session',
      description: 'This is a test mentorship session created via API',
      start: {
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
        timeZone: 'America/Sao_Paulo',
      },
      attendees: [
        {
          email: 'test@example.com',
          displayName: 'Test User',
        },
      ],
    };

    const result = await createCalendarEvent(testEvent);

    return NextResponse.json({
      success: true,
      event: result,
      message: 'Test event created successfully',
    });
  } catch (error) {
    console.error('Error creating test event:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Google Calendar API test endpoint',
    instructions: 'Send a POST request to create a test event',
  });
}