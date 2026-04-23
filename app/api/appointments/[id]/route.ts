import { createClient } from '@/lib/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/types/supabase';

type AppointmentRow = Database['public']['Tables']['appointments']['Row'];
import { 
  updateCalendarEvent, 
  deleteCalendarEvent
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
    const { status } = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // 1. Get current appointment to check permissions
    const { data: appointmentData, error: fetchError } = await supabase
      .from('appointments')
      .select('id, mentor_id, mentee_id, status, google_event_id')
      .eq('id', appointmentId)
      .single();

    const appointment = appointmentData as AppointmentRow | null;

    if (fetchError || !appointment) {
      return errorResponse('Appointment not found', 'NOT_FOUND', 404);
    }

    if (appointment.mentor_id !== user.id && appointment.mentee_id !== user.id) {
      return errorResponse('Access denied', 'FORBIDDEN', 403);
    }

    // 2. Business Logic for status transitions
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // removed confirmed_at logic entirely, not in DB
    /* if (status === 'confirmed' && appointment.status === 'pending') {
      updateData.confirmed_at = new Date().toISOString();
    } */

    if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancelled_by = user.id;
    }

    // 3. Update in Database
    const { data: updateDataResult, error: updateError } = await (supabase
      .from('appointments') as any)
      .update(updateData)
      .eq('id', appointmentId)
      .select()
      .single();

    const updatedAppointment = updateDataResult as AppointmentRow | null;

    if (updateError) throw updateError;

    // 4. Handle Google Calendar Sync if needed
    if (status === 'cancelled' && appointment.google_event_id) {
        try {
            await deleteCalendarEvent(user.id, appointment.google_event_id);
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
    const { data: appointmentData } = await supabase
      .from('appointments')
      .select('mentor_id, mentee_id, google_event_id')
      .eq('id', appointmentId)
      .single();

    const appointment = appointmentData as AppointmentRow | null;

    if (!appointment) {
      return errorResponse('Appointment not found', 'NOT_FOUND', 404);
    }

    if (appointment.mentor_id !== user.id && appointment.mentee_id !== user.id) {
      return errorResponse('Access denied', 'FORBIDDEN', 403);
    }

    // Delete calendar event
    if (appointment.google_event_id) {
        try {
            await deleteCalendarEvent(user.id, appointment.google_event_id);
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
