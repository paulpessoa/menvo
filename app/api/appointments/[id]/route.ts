import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { deleteCalendarEvent } from '@/lib/services/mentorship/google-calendar.service';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface AppointmentDetails {
    id: string;
    mentor_id: string;
    mentee_id: string;
    status: string;
    scheduled_at: string;
    google_event_id: string | null;
    duration_minutes: number;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        mentor:profiles!mentor_id(id, email, first_name, last_name, full_name, avatar_url),
        mentee:profiles!mentee_id(id, email, first_name, last_name, full_name, avatar_url)
      `)
      .eq('id', id)
      .returns<any>()
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const appt = appointment as AppointmentDetails;

    if (appt.mentor_id !== user.id && appt.mentee_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: appointmentId } = await params;
    const body = await request.json();
    const { status, notes_mentor } = body;
    
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data: currentAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .returns<any>()
      .single();

    if (fetchError || !currentAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (currentAppointment.mentor_id !== user.id && currentAppointment.mentee_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (status === 'confirmed' && currentAppointment.status === 'pending') {
      try {
        const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/appointments/confirm`;
        const confirmResponse = await fetch(confirmUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appointmentId, mentorNotes: notes_mentor }),
        });

        if (!confirmResponse.ok) {
          return NextResponse.json({ error: 'Failed to confirm' }, { status: 500 });
        }
        
        const successData = await confirmResponse.json();
        const { data: confirmedAppointment } = await supabase
          .from('appointments')
          .select(`
            *,
            mentor:profiles!mentor_id(id, email, first_name, last_name, full_name, avatar_url),
            mentee:profiles!mentee_id(id, email, first_name, last_name, full_name, avatar_url)
          `)
          .eq('id', appointmentId)
          .returns<any>()
          .single();

        return NextResponse.json({
          success: true,
          appointment: confirmedAppointment,
          googleMeetLink: successData.googleMeetLink,
          message: 'Appointment confirmed successfully',
        });
      } catch (confirmError) {
        return NextResponse.json({ error: 'Failed to trigger confirmation flow' }, { status: 500 });
      }
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (notes_mentor !== undefined) updateData.notes_mentor = notes_mentor;

    if (status === 'cancelled' && currentAppointment.google_event_id) {
      try { await deleteCalendarEvent(); } catch (e) { /* ignore */ }
    }

    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update(updateData as any)
      .eq('id', appointmentId)
      .select(`
        *,
        mentor:profiles!mentor_id(id, email, first_name, last_name, full_name, avatar_url),
        mentee:profiles!mentee_id(id, email, first_name, last_name, full_name, avatar_url)
      `)
      .returns<any>()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, appointment: updatedAppointment });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: appointmentId } = await params;

    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .returns<any>()
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.mentor_id !== user.id && appointment.mentee_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (appointment.google_event_id) {
      try { await deleteCalendarEvent(); } catch (e) { /* ignore */ }
    }

    const { error: deleteError } = await supabase.from('appointments').delete().eq('id', appointmentId);
    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true, message: 'Appointment deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
