import { createClient } from '@/lib/utils/supabase/server';
import { NextResponse } from 'next/server';
import { 
  updateGoogleCalendarEvent, 
  deleteGoogleCalendarEvent, 
  hasGoogleCalendarConnected 
} from '@/lib/services/mentorship/google-calendar.service';
import { 
  errorResponse, 
  handleApiError, 
  successResponse 
} from '@/lib/api/error-handler';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params;
    const supabase = await createClient();
    const { status, message } = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // 1. Get current appointment to check permissions
    const { data: currentAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .returns<any>()
      .single();

    if (fetchError || !currentAppointment) {
      return errorResponse('Appointment not found', 'NOT_FOUND', 404);
    }

    const appointment = currentAppointment;

    if (appointment.mentor_id !== user.id && appointment.mentee_id !== user.id) {
      return errorResponse('Access denied', 'FORBIDDEN', 403);
    }

    // 2. Business Logic for status transitions
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'confirmed' && appointment.status === 'pending') {
      updateData.confirmed_at = new Date().toISOString();
    }

    if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancelled_by = user.id;
    }

    // 3. Update in Database
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .select()
      .returns<any>()
      .single();

    if (updateError) throw updateError;

    // 4. Handle Google Calendar Sync if needed
    if (status === 'cancelled' && appointment.google_event_id) {
        try {
            await deleteGoogleCalendarEvent(user.id, appointment.google_event_id);
        } catch (calError) {
            console.error('Failed to delete calendar event:', calError);
        }
    }

    return successResponse(updatedAppointment, `Appointment ${status} successfully`);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // Check permissions
    const { data: appointment } = await supabase
      .from('appointments')
      .select('mentor_id, mentee_id, google_event_id')
      .eq('id', appointmentId)
      .returns<any>()
      .single();

    if (!appointment) {
      return errorResponse('Appointment not found', 'NOT_FOUND', 404);
    }

    if (appointment.mentor_id !== user.id && appointment.mentee_id !== user.id) {
      return errorResponse('Access denied', 'FORBIDDEN', 403);
    }

    // Delete calendar event
    if (appointment.google_event_id) {
        try {
            await deleteGoogleCalendarEvent(user.id, appointment.google_event_id);
        } catch (calError) {}
    }

    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (deleteError) throw deleteError;

    return successResponse(null, 'Appointment deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
