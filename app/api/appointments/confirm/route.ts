import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Initialize OAuth2 client with service account or app credentials
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CALENDAR_CLIENT_ID,
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
  process.env.GOOGLE_CALENDAR_REDIRECT_URI
);

// Set credentials if refresh token is available
if (process.env.GOOGLE_CALENDAR_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
  });
}

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get the current user (should be mentor)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Missing appointmentId' },
        { status: 400 }
      );
    }

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        mentor:mentor_id(id, email, first_name, last_name, full_name),
        mentee:mentee_id(id, email, first_name, last_name, full_name)
      `)
      .eq('id', appointmentId)
      .eq('mentor_id', user.id) // Ensure only mentor can confirm their appointments
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check if appointment is in pending status
    if (appointment.status !== 'pending') {
      return NextResponse.json(
        { error: 'Appointment is not in pending status' },
        { status: 400 }
      );
    }

    // Create Google Calendar event
    let googleEventId: string | undefined;
    let googleMeetLink: string | undefined;

    try {
      const startTime = new Date(appointment.scheduled_at);
      const endTime = new Date(startTime.getTime() + appointment.duration_minutes * 60 * 1000);

      const eventData = {
        summary: `Mentoria: ${appointment.mentor.full_name || appointment.mentor.first_name} & ${appointment.mentee.full_name || appointment.mentee.first_name}`,
        description: `Sessão de mentoria confirmada através da plataforma MENVO.
        
Mentor: ${appointment.mentor.full_name || `${appointment.mentor.first_name} ${appointment.mentor.last_name}`}
Mentee: ${appointment.mentee.full_name || `${appointment.mentee.first_name} ${appointment.mentee.last_name}`}

${appointment.notes ? `Observações: ${appointment.notes}` : ''}

Plataforma: MENVO - Mentores Voluntários`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        attendees: [
          {
            email: appointment.mentor.email,
            displayName: appointment.mentor.full_name || `${appointment.mentor.first_name} ${appointment.mentor.last_name}`,
          },
          {
            email: appointment.mentee.email,
            displayName: appointment.mentee.full_name || `${appointment.mentee.first_name} ${appointment.mentee.last_name}`,
          },
        ],
        conferenceData: {
          createRequest: {
            requestId: `menvo-${appointmentId}-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 }, // 30 minutes before
          ],
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        requestBody: eventData,
      });

      const event = response.data;
      googleEventId = event.id;
      
      // Extract Google Meet link
      if (event.hangoutLink) {
        googleMeetLink = event.hangoutLink;
      } else if (event.conferenceData?.entryPoints) {
        const meetEntry = event.conferenceData.entryPoints.find(
          entry => entry.entryPointType === 'video'
        );
        if (meetEntry) {
          googleMeetLink = meetEntry.uri;
        }
      }

    } catch (calendarError) {
      console.error('Error creating calendar event:', calendarError);
      
      // Return error if calendar creation fails
      return NextResponse.json(
        { 
          error: 'Failed to create calendar event',
          details: calendarError instanceof Error ? calendarError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Update appointment status to confirmed and add calendar info
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'confirmed',
        google_event_id: googleEventId,
        google_meet_link: googleMeetLink,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)
      .select(`
        *,
        mentor:mentor_id(id, email, first_name, last_name, full_name, avatar_url),
        mentee:mentee_id(id, email, first_name, last_name, full_name, avatar_url)
      `)
      .single();

    if (updateError) {
      console.error('Error updating appointment:', updateError);
      
      // Try to delete the calendar event if appointment update fails
      if (googleEventId) {
        try {
          await calendar.events.delete({
            calendarId: 'primary',
            eventId: googleEventId,
          });
        } catch (deleteError) {
          console.error('Error deleting calendar event after appointment update failure:', deleteError);
        }
      }

      return NextResponse.json(
        { error: 'Failed to confirm appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      googleMeetLink,
      message: 'Appointment confirmed successfully and calendar event created',
    });

  } catch (error) {
    console.error('Error in appointment confirmation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}