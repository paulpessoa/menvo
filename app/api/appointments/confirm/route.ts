import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendAppointmentConfirmation } from '@/lib/email/brevo';
import { createCalendarEvent } from '@/lib/calendar/google-calendar';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse do body
    const body = await request.json();
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'appointmentId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar appointment com informações do mentor e mentee
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        mentor:mentor_id(id, full_name, email),
        mentee:mentee_id(id, full_name, email)
      `)
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    // Criar evento no Google Calendar (se possível)
    let googleEventId: string | null = null;
    try {
      const eventData = {
        summary: `Mentoria: ${appointment.mentee.full_name}`,
        description: `Sessão de mentoria entre ${appointment.mentor.full_name} e ${appointment.mentee.full_name}`,
        startTime: new Date(appointment.scheduled_at),
        endTime: new Date(
          new Date(appointment.scheduled_at).getTime() +
            appointment.duration_minutes * 60 * 1000
        ),
        attendeeEmail: appointment.mentee.email,
      };

      googleEventId = await createCalendarEvent(appointment.mentor_id, eventData);

      // Salvar google_event_id no banco
      if (googleEventId) {
        await supabase
          .from('appointments')
          .update({ google_event_id: googleEventId })
          .eq('id', appointmentId);
      }
    } catch (calendarError) {
      console.error('[CONFIRM] Erro ao criar evento no Google Calendar:', calendarError);
      // Não falhar a requisição se o calendário falhar
    }

    // Enviar email de confirmação
    try {
      await sendAppointmentConfirmation({
        mentorEmail: appointment.mentor.email,
        menteeEmail: appointment.mentee.email,
        mentorName: appointment.mentor.full_name,
        menteeName: appointment.mentee.full_name,
        scheduledAt: appointment.scheduled_at,
      });
    } catch (emailError) {
      console.error('[CONFIRM] Erro ao enviar email de confirmação:', emailError);
      // Não falhar a requisição se o email falhar
    }

    return NextResponse.json({
      success: true,
      googleEventId,
    });
  } catch (error) {
    console.error('[CONFIRM] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
