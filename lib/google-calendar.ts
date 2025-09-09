import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Initialize OAuth2 client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CALENDAR_CLIENT_ID,
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
  process.env.GOOGLE_CALENDAR_REDIRECT_URI
);

// Debug: Check if environment variables are loaded
if (!process.env.GOOGLE_CALENDAR_CLIENT_ID) {
  console.error('❌ GOOGLE_CALENDAR_CLIENT_ID not found in environment variables');
}
if (!process.env.GOOGLE_CALENDAR_CLIENT_SECRET) {
  console.error('❌ GOOGLE_CALENDAR_CLIENT_SECRET not found in environment variables');
}
if (!process.env.GOOGLE_CALENDAR_REFRESH_TOKEN) {
  console.warn('⚠️ GOOGLE_CALENDAR_REFRESH_TOKEN not found - authorization needed');
}

// Set refresh token
if (process.env.GOOGLE_CALENDAR_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
  });
}

// Initialize Calendar API
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

export interface CalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees: Array<{
    email: string;
    displayName?: string;
  }>;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
    };
  };
}

export interface CreateEventResponse {
  id: string;
  htmlLink: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
    }>;
  };
}

/**
 * Create a calendar event with Google Meet integration
 */
export async function createCalendarEvent(
  eventData: CalendarEvent
): Promise<CreateEventResponse> {
  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: {
        ...eventData,
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      },
    });

    const event = response.data;
    
    return {
      id: event.id!,
      htmlLink: event.htmlLink!,
      hangoutLink: event.hangoutLink,
      conferenceData: event.conferenceData,
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error('Failed to create calendar event');
  }
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
  eventId: string,
  eventData: Partial<CalendarEvent>
): Promise<CreateEventResponse> {
  try {
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: eventData,
    });

    const event = response.data;
    
    return {
      id: event.id!,
      htmlLink: event.htmlLink!,
      hangoutLink: event.hangoutLink,
      conferenceData: event.conferenceData,
    };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw new Error('Failed to update calendar event');
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw new Error('Failed to delete calendar event');
  }
}

/**
 * Get calendar event details
 */
export async function getCalendarEvent(eventId: string) {
  try {
    const response = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });

    return response.data;
  } catch (error) {
    console.error('Error getting calendar event:', error);
    throw new Error('Failed to get calendar event');
  }
}

/**
 * Check if mentor has available time slots
 */
export async function checkMentorAvailability(
  mentorEmail: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startTime,
        timeMax: endTime,
        items: [{ id: mentorEmail }],
      },
    });

    const busyTimes = response.data.calendars?.[mentorEmail]?.busy || [];
    return busyTimes.length === 0;
  } catch (error) {
    console.error('Error checking availability:', error);
    return false;
  }
}

/**
 * Generate OAuth URL for Google Calendar authorization
 */
export function getAuthUrl(): string {
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

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw new Error('Failed to exchange authorization code');
  }
}
