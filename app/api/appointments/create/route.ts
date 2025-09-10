import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createCalendarEvent } from '@/lib/google-calendar';
import { CreateAppointmentRequest } from '@/types/appointments';

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
    const body: CreateAppointmentRequest = await request.json();
    const { mentor_id, scheduled_at, duration_minutes = 60, message } = body;

    // Validate required fields
    if (!mentor_id || !scheduled_at) {
      return NextResponse.json(
        { error: 'Missing required fields: mentor_id, scheduled_at' },
        { status: 400 }
      );
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduled_at);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Get mentor profile
    const { data: mentorProfile, error: mentorError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, full_name, verified')
      .eq('id', mentor_id)
      .single();

    if (mentorError || !mentorProfile) {
      return NextResponse.json(
        { error: 'Mentor not found' },
        { status: 404 }
      );
    }

    // Check if mentor is verified
    if (!mentorProfile.verified) {
      return NextResponse.json(
        { error: 'Mentor is not verified' },
        { status: 400 }
      );
    }

    // Get mentee profile
    const { data: menteeProfile, error: menteeError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, full_name')
      .eq('id', user.id)
      .single();

    if (menteeError || !menteeProfile) {
      return NextResponse.json(
        { error: 'Mentee profile not found' },
        { status: 404 }
      );
    }

    // Check for conflicting appointments
    const endTime = new Date(scheduledDate.getTime() + duration_minutes * 60 * 1000);
    
    const { data: conflicts, error: conflictError } = await supabase
      .from('appointments')
      .select('id')
      .eq('mentor_id', mentor_id)
      .in('status', ['pending', 'confirmed'])
      .gte('scheduled_at', scheduledDate.toISOString())
      .lt('scheduled_at', endTime.toISOString());

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError);
      return NextResponse.json(
        { error: 'Error checking availability' },
        { status: 500 }
      );
    }

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Time slot is not available' },
        { status: 409 }
      );
    }

    // Create calendar event
    let googleEventId: string | undefined;
    let googleMeetLink: string | undefined;

    try {
      const calendarEvent = {
        summary: `Mentoria: ${mentorProfile.full_name || mentorProfile.first_name} & ${menteeProfile.full_name || menteeProfile.first_name}`,
        description: `Sessão de mentoria agendada através da plataforma.\n\n${message ? `Mensagem do mentee: ${message}` : ''}`,
        start: {
          dateTime: scheduledDate.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        attendees: [
          {
            email: mentorProfile.email,
            displayName: mentorProfile.full_name || `${mentorProfile.first_name} ${mentorProfile.last_name}`,
          },
          {
            email: menteeProfile.email,
            displayName: menteeProfile.full_name || `${menteeProfile.first_name} ${menteeProfile.last_name}`,
          },
        ],
      };

      const calendarResult = await createCalendarEvent(calendarEvent);
      googleEventId = calendarResult.id;
      
      // Extract Google Meet link
      if (calendarResult.hangoutLink) {
        googleMeetLink = calendarResult.hangoutLink;
      } else if (calendarResult.conferenceData?.entryPoints) {
        const meetEntry = calendarResult.conferenceData.entryPoints.find(
          entry => entry.entryPointType === 'video'
        );
        if (meetEntry) {
          googleMeetLink = meetEntry.uri;
        }
      }
    } catch (calendarError) {
      console.error('Error creating calendar event:', calendarError);
      // Continue without calendar event - we can create it later
    }

    // Create appointment in database
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        mentor_id,
        mentee_id: user.id,
        scheduled_at: scheduledDate.toISOString(),
        duration_minutes,
        google_event_id: googleEventId,
        google_meet_link: googleMeetLink,
        status: 'pending',
        notes: message,
      })
      .select(`
        *,
        mentor:mentor_id(id, email, first_name, last_name, full_name, avatar_url),
        mentee:mentee_id(id, email, first_name, last_name, full_name, avatar_url)
      `)
      .single();

    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError);
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment,
      message: 'Appointment created successfully',
    });

  } catch (error) {
    console.error('Error in appointment creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}