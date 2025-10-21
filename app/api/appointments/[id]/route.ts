import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const appointmentId = params.id;

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
    const supabase = createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const appointmentId = params.id;
    const body = await request.json();
    const { status, notes } = body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get current appointment
    const { data: currentAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !currentAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

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
      // Update status first
      const { error: statusUpdateError } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointmentId);

      if (statusUpdateError) {
        console.error('Error updating status:', statusUpdateError);
        return NextResponse.json(
          { error: 'Failed to update status' },
          { status: 500 }
        );
      }

      // Trigger confirmation flow (Google Calendar + emails)
      try {
        const confirmResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/appointments/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointmentId: parseInt(appointmentId),
          }),
        });

        if (!confirmResponse.ok) {
          console.error('Error in confirmation flow');
        }
      } catch (confirmError) {
        console.error('Error triggering confirmation:', confirmError);
        // Don't fail the request, status is already updated
      }

      // Return early since we already updated
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
        message: 'Appointment confirmed successfully',
      });
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
    const supabase = createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const appointmentId = params.id;

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