import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { CreateAppointmentRequest } from '@/types/appointments';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
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

    // Note: Calendar event will be created when mentor confirms the appointment
    // This allows mentor to add notes before creating the event
    let googleEventId: string | undefined;
    let googleMeetLink: string | undefined;

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
        notes_mentee: message, // Comentários/notas do mentee
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