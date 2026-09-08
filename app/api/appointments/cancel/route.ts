import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/utils/supabase/server';

import { cancelAppointmentSchema } from '@/lib/schemas/appointment';
import { sendAppointmentCancellation } from '@/lib/email/brevo';

export async function POST(request: NextRequest) {
  try {
    // Buscar usuário atual
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Usar Service Role para bypass RLS
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

    const body = await request.json().catch(() => ({}));
    const parseResult = cancelAppointmentSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Dados inválidos para cancelamento' },
        { status: 400 }
      );
    }

    const { appointmentId, reason } = parseResult.data;

    // Buscar appointment
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
      console.error('[CANCEL] Erro ao buscar appointment:', fetchError);
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já está cancelado
    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Agendamento já foi cancelado' },
        { status: 400 }
      );
    }

    // Atualizar status para cancelled e salvar motivo
    const updateData = {
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId);

    if (updateError) {
      console.error('[CANCEL] Erro ao cancelar appointment:', updateError);
      return NextResponse.json(
        { error: 'Erro ao cancelar agendamento', details: updateError.message },
        { status: 500 }
      );
    }

    // TODO: Remover evento do Google Calendar se existir
    
    // Notificar a outra parte por e-mail com motivo do cancelamento
    try {
      type PersonInfo = { id?: string; full_name?: string | null; email?: string | null };
      const mentor = (Array.isArray(appointment.mentor) ? appointment.mentor[0] : appointment.mentor) as PersonInfo | null;
      const mentee = (Array.isArray(appointment.mentee) ? appointment.mentee[0] : appointment.mentee) as PersonInfo | null;

      const isMentorCancelling = user.id === mentor?.id;
      const recipient = isMentorCancelling ? mentee : mentor;
      const cancelledByName = isMentorCancelling
        ? (mentor?.full_name || 'Seu mentor')
        : (mentee?.full_name || 'Seu mentorado');
      const otherPersonName = isMentorCancelling
        ? (mentor?.full_name || 'Mentor')
        : (mentee?.full_name || 'Mentorado');

      if (recipient?.email) {
        await sendAppointmentCancellation({
          recipientEmail: recipient.email,
          recipientName: recipient.full_name || 'Usuário Menvo',
          otherPersonName,
          scheduledAt: appointment.scheduled_at,
          reason,
          cancelledByName,
        });
      }
    } catch (emailError) {
      console.error('[CANCEL] Erro ao enviar email de cancelamento:', emailError);
      // Falhas de e-mail não impedem a conclusão do cancelamento no banco
    }

    return NextResponse.json({
      success: true,
      message: 'Agendamento cancelado com sucesso',
    });

  } catch (error) {
    console.error('[CANCEL] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
