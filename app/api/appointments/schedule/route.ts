import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendAppointmentRequest } from '@/lib/email/brevo';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Parse do body
    const body = await request.json();
    const { mentorId, scheduledAt, duration, message } = body;

    // Validação básica
    if (!mentorId || !scheduledAt || !duration || !message) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Validar duração (apenas 45 minutos)
    if (duration !== 45) {
      return NextResponse.json(
        { error: 'Duração deve ser até 60 minutos' },
        { status: 400 }
      );
    }

    // Impedir que mentor agende consigo mesmo
    if (mentorId === user.id) {
      return NextResponse.json(
        { error: 'Você não pode agendar uma mentoria consigo mesmo' },
        { status: 400 }
      );
    }

    // Buscar informações do mentor
    const { data: mentorProfile, error: mentorError } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', mentorId)
      .single();

    if (mentorError || !mentorProfile) {
      console.error('[APPOINTMENT] Erro ao buscar mentor:', mentorError);
      return NextResponse.json(
        { error: 'Mentor não encontrado' },
        { status: 404 }
      );
    }

    // Buscar informações do mentee (usuário atual)
    const { data: menteeProfile, error: menteeError } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single();

    if (menteeError || !menteeProfile) {
      console.error('[APPOINTMENT] Erro ao buscar mentee:', menteeError);
      return NextResponse.json(
        { error: 'Perfil do usuário não encontrado' },
        { status: 404 }
      );
    }

    const mentorFullName = `${mentorProfile.first_name} ${mentorProfile.last_name}`.trim();
    const menteeFullName = `${menteeProfile.first_name} ${menteeProfile.last_name}`.trim();

    // Gerar token de ação seguro
    const actionToken = crypto.randomBytes(32).toString('hex');

    // Criar appointment no banco
    console.log('[APPOINTMENT] Tentando criar agendamento:', {
      mentor_id: mentorId,
      mentee_id: user.id,
      scheduled_at: scheduledAt,
      duration_minutes: duration,
      status: 'pending',
    });

    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        mentor_id: mentorId,
        mentee_id: user.id,
        scheduled_at: scheduledAt,
        duration_minutes: duration,
        status: 'pending',
        notes_mentee: message, // Comentários/notas do mentee
        action_token: actionToken,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[APPOINTMENT] Erro ao criar agendamento:', insertError);
      console.error('[APPOINTMENT] Detalhes do erro:', JSON.stringify(insertError, null, 2));
      return NextResponse.json(
        { 
          error: JSON.stringify(insertError),
          // error: 'Erro ao criar agendamento',
          details: insertError.message,
          code: insertError.code 
        },
        { status: 500 }
      );
    }

    // Enviar email ao mentor
    try {
      await sendAppointmentRequest({
        mentorEmail: mentorProfile.email,
        mentorName: mentorFullName,
        menteeName: menteeFullName,
        scheduledAt,
        message,
        token: actionToken,
      });
      console.log('[APPOINTMENT] ✅ Email enviado para o mentor');
    } catch (emailError) {
      console.error('[APPOINTMENT] ⚠️ Erro ao enviar email, mas agendamento foi criado:', emailError);
      // Não falhar a requisição se o email falhar
    }

    return NextResponse.json({
      success: true,
      appointmentId: appointment.id,
    });
  } catch (error) {
    console.error('[APPOINTMENT] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
