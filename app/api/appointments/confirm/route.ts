import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { sendAppointmentConfirmation } from '@/lib/email/brevo';
import { createCalendarEvent, isGoogleCalendarConfigured } from '@/lib/services/google-calendar.service';

export async function POST(request: NextRequest) {
  try {
    // Usar Service Role para bypass RLS (chamada interna)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('✅ [CONFIRM] Using Service Role client');

    // Parse do body
    const body = await request.json();
    const { appointmentId: rawAppointmentId, mentorNotes } = body;

    if (!rawAppointmentId) {
      return NextResponse.json(
        { error: 'appointmentId é obrigatório' },
        { status: 400 }
      );
    }

    // Converter para number se for string
    const appointmentId = typeof rawAppointmentId === 'string' 
      ? parseInt(rawAppointmentId, 10) 
      : rawAppointmentId;

    console.log('🔍 [CONFIRM] Appointment ID:', appointmentId, 'Type:', typeof appointmentId);

    // Buscar appointment com informações do mentor e mentee
    console.log('🔍 [CONFIRM] Buscando appointment no banco...');
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        mentor:mentor_id(id, full_name, email),
        mentee:mentee_id(id, full_name, email)
      `)
      .eq('id', appointmentId)
      .single();

    if (fetchError) {
      console.error('❌ [CONFIRM] Erro ao buscar appointment:', fetchError);
      console.error('   Details:', JSON.stringify(fetchError, null, 2));
    }

    if (!appointment) {
      console.error('❌ [CONFIRM] Appointment não encontrado. ID:', appointmentId);
      
      // Debug: tentar buscar sem o join para ver se o appointment existe
      const { data: simpleAppointment } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();
      
      console.log('🔍 [CONFIRM] Appointment simples:', simpleAppointment ? 'Encontrado' : 'Não encontrado');
      
      return NextResponse.json(
        { error: 'Agendamento não encontrado', details: fetchError?.message },
        { status: 404 }
      );
    }

    console.log('✅ [CONFIRM] Appointment encontrado:', {
      id: appointment.id,
      mentor: appointment.mentor?.full_name,
      mentee: appointment.mentee?.full_name,
      status: appointment.status,
    });

    // Verificar se já está confirmado
    if (appointment.status === 'confirmed') {
      return NextResponse.json(
        { error: 'Agendamento já foi confirmado' },
        { status: 400 }
      );
    }

    // Criar evento no Google Calendar
    let googleEventId: string | null = null;
    let googleMeetLink: string | null = null;
    let calendarError: string | null = null;

    if (isGoogleCalendarConfigured()) {
      try {
        const startTime = new Date(appointment.scheduled_at);
        const endTime = new Date(
          startTime.getTime() + appointment.duration_minutes * 60 * 1000
        );

        // Montar descrição completa
        let description = `Sessão de mentoria confirmada através da plataforma MENVO.\n\n`;
        description += `👤 Mentor: ${appointment.mentor.full_name}\n`;
        description += `👤 Mentee: ${appointment.mentee.full_name}\n`;
        description += `⏱️ Duração: ${appointment.duration_minutes} minutos\n\n`;

        if (appointment.notes) {
          description += `📝 Mensagem do mentee:\n${appointment.notes}\n\n`;
        }

        if (mentorNotes) {
          description += `💬 Observações do mentor:\n${mentorNotes}\n\n`;
        }

        description += `---\n`;
        description += `Plataforma: MENVO - Mentoria Voluntária\n`;
        description += `🔗 Link do Meet será gerado automaticamente`;

        const eventData = {
          summary: `Mentoria: ${appointment.mentor.full_name} & ${appointment.mentee.full_name}`,
          description,
          startTime,
          endTime,
          mentorEmail: appointment.mentor.email,
          mentorName: appointment.mentor.full_name,
          menteeEmail: appointment.mentee.email,
          menteeName: appointment.mentee.full_name,
        };

        const result = await createCalendarEvent(eventData);
        googleEventId = result.eventId;
        googleMeetLink = result.meetLink;

        console.log('✅ [CONFIRM] Evento criado no Google Calendar:', {
          eventId: googleEventId,
          meetLink: googleMeetLink,
        });

      } catch (error) {
        console.error('❌ [CONFIRM] Erro ao criar evento no Google Calendar:', error);
        calendarError = error instanceof Error ? error.message : 'Erro desconhecido';
        // Continua mesmo com erro no calendar
      }
    } else {
      console.warn('⚠️ [CONFIRM] Google Calendar não configurado, pulando criação de evento');
      calendarError = 'Google Calendar não configurado';
    }

    // Atualizar appointment no banco
    const updateData: any = {
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    };

    if (googleEventId) {
      updateData.google_event_id = googleEventId;
    }

    if (googleMeetLink) {
      updateData.google_meet_link = googleMeetLink;
    }

    if (mentorNotes) {
      // Adicionar observações do mentor às notas existentes
      const existingNotes = appointment.notes || '';
      updateData.notes = existingNotes 
        ? `${existingNotes}\n\n---\nObservações do mentor:\n${mentorNotes}`
        : `Observações do mentor:\n${mentorNotes}`;
    }

    console.log('💾 [CONFIRM] Atualizando appointment no banco...', updateData);

    const { error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId);

    if (updateError) {
      console.error('❌ [CONFIRM] Erro ao atualizar appointment:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar agendamento', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ [CONFIRM] Appointment atualizado com sucesso!');

    // Enviar email de confirmação
    try {
      await sendAppointmentConfirmation({
        mentorEmail: appointment.mentor.email,
        menteeEmail: appointment.mentee.email,
        mentorName: appointment.mentor.full_name,
        menteeName: appointment.mentee.full_name,
        scheduledAt: appointment.scheduled_at,
        meetLink: googleMeetLink,
      });
    } catch (emailError) {
      console.error('❌ [CONFIRM] Erro ao enviar email de confirmação:', emailError);
      // Não falhar a requisição se o email falhar
    }

    return NextResponse.json({
      success: true,
      googleEventId,
      googleMeetLink,
      calendarError,
      message: googleEventId 
        ? 'Mentoria confirmada e evento criado no Google Calendar'
        : 'Mentoria confirmada (evento do Calendar não foi criado)',
    });

  } catch (error) {
    console.error('❌ [CONFIRM] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
