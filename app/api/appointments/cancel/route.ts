import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Initialize OAuth2 client
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
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { appointmentId, reason } = await request.json();

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
      .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`) // Allow both mentor and mentee to cancel
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check if appointment can be cancelled
    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Appointment is already cancelled' },
        { status: 400 }
      );
    }

    // Delete Google Calendar event if it exists
    if (appointment.google_event_id) {
      try {
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: appointment.google_event_id,
        });
      } catch (calendarError) {
        console.error('Error deleting calendar event:', calendarError);
        // Continue with cancellation even if calendar deletion fails
      }
    }

    // Update appointment status to cancelled
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        cancelled_by: user.id,
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
      return NextResponse.json(
        { error: 'Failed to cancel appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      message: 'Appointment cancelled successfully',
    });

  } catch (error) {
    console.error('Error in appointment cancellation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}