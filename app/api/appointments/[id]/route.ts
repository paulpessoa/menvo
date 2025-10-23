import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { deleteCalendarEvent } from '@/lib/services/google-calendar.service';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Await params (Next.js 15 requirement)
    const { id } = await params;
    const appointmentId = id;

    // Get appointment with profiles
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        mentor:mentor_id(id, email, first_name, last_name, full_name, avatar_url),
        mentee:mentee_id(id, email, first_name, last_name, full_name, avatar_url)
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if user is involved in this appointment
    if (appointment.mentor_id !== user.id && appointment.mentee_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment,
    });

  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ [PATCH APPOINTMENT] Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Await params (Next.js 15 requirement)
    const { id } = await params;
    const appointmentId = id;
    console.log('🔄 [PATCH APPOINTMENT] ID:', appointmentId, 'User:', user.id);
    
    const body = await request.json();
    const { status, notes } = body;
    
    console.log('📝 [PATCH APPOINTMENT] Body:', { status, notes });

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get current appointment
    console.log('🔍 [PATCH APPOINTMENT] Buscando appointment ID:', appointmentId);
    
    const { data: currentAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (fetchError) {
      console.error('❌ [PATCH APPOINTMENT] Erro ao buscar:', fetchError);
    }

    if (!currentAppointment) {
      console.error('❌ [PATCH APPOINTMENT] Appointment não encontrado. ID:', appointmentId);
      
      // Debug: listar todos os appointments
      const { data: allAppointments } = await supabase
        .from('appointments')
        .select('id, status')
        .limit(10);
      
      console.log('📋 [PATCH APPOINTMENT] Appointments disponíveis:', allAppointments);
      
      return NextResponse.json(
        { error: 'Appointment not found', availableIds: allAppointments?.map(a => a.id) },
        { status: 404 }
      );
    }

    console.log('✅ [PATCH APPOINTMENT] Appointment encontrado:', {
      id: currentAppointment.id,
      status: currentAppointment.status,
    });

    // Check if user is involved in this appointment
    if (currentAppointment.mentor_id !== user.id && currentAppointment.mentee_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Handle status change to confirmed - trigger full confirmation flow
    if (status === 'confirmed' && currentAppointment.status === 'pending') {
      console.log('✅ [PATCH APPOINTMENT] Confirming appointment...');
      console.log('📋 [PATCH APPOINTMENT] Current appointment:', {
        id: currentAppointment.id,
        mentor_id: currentAppointment.mentor_id,
        mentee_id: currentAppointment.mentee_id,
        status: currentAppointment.status,
      });
      
      // NÃO atualizar o status ainda - deixar o /confirm fazer isso
      // Trigger confirmation flow (Google Calendar + emails)
      console.log('🔄 [PATCH APPOINTMENT] Triggering confirmation flow...');
      
      try {
        const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/appointments/confirm`;
        console.log('📞 [PATCH APPOINTMENT] Calling:', confirmUrl);
        
        const confirmResponse = await fetch(confirmUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointmentId: appointmentId,
            mentorNotes: notes, // Passar as notas do mentor
          }),
        });

        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json();
          console.error('❌ [PATCH APPOINTMENT] Confirmation flow error:', errorData);
          return NextResponse.json(
            { error: 'Failed to confirm appointment', details: errorData },
            { status: 500 }
          );
        }
        
        const successData = await confirmResponse.json();
        console.log('✅ [PATCH APPOINTMENT] Confirmation flow success:', successData);
        
        // Buscar appointment atualizado
        const { data: confirmedAppointment } = await supabase
          .from('appointments')
          .select(`
            *,
            mentor:mentor_id(id, email, first_name, last_name, full_name, avatar_url),
            mentee:mentee_id(id, email, first_name, last_name, full_name, avatar_url)
          `)
          .eq('id', appointmentId)
          .single();

        return NextResponse.json({
          success: true,
          appointment: confirmedAppointment,
          googleMeetLink: successData.googleMeetLink,
          message: 'Appointment confirmed successfully',
        });
        
      } catch (confirmError) {
        console.error('❌ [PATCH APPOINTMENT] Error triggering confirmation:', confirmError);
        return NextResponse.json(
          { error: 'Failed to trigger confirmation flow' },
          { status: 500 }
        );
      }
    }

    // Handle calendar event updates for other status changes
    if (status && currentAppointment.google_event_id) {
      try {
        if (status === 'cancelled') {
          // Delete calendar event
          await deleteCalendarEvent(currentAppointment.google_event_id);
        }
      } catch (calendarError) {
        console.error('Error updating calendar event:', calendarError);
        // Continue with database update even if calendar fails
      }
    }

    // Update appointment in database
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
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
        { error: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      message: 'Appointment updated successfully',
    });

  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Await params (Next.js 15 requirement)
    const { id } = await params;
    const appointmentId = id;

    // Get current appointment
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if user is involved in this appointment
    if (appointment.mentor_id !== user.id && appointment.mentee_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete calendar event if exists
    if (appointment.google_event_id) {
      try {
        await deleteCalendarEvent(appointment.google_event_id);
      } catch (calendarError) {
        console.error('Error deleting calendar event:', calendarError);
        // Continue with database deletion even if calendar fails
      }
    }

    // Delete appointment from database
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (deleteError) {
      console.error('Error deleting appointment:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}