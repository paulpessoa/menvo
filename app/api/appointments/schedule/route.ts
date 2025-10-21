import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendAppointmentRequest } from '@/lib/email/brevo';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

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

    // Validar duração (30 ou 60 minutos)
    if (![30, 60].includes(duration)) {
      return NextResponse.json(
        { error: 'Duração deve ser 30 ou 60 minutos' },
        { status: 400 }
      );
    }

    // Buscar informações do mentor
    const { data: mentorProfile, error: mentorError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', mentorId)
      .single();

    if (mentorError || !mentorProfile) {
      return NextResponse.json(
        { error: 'Mentor não encontrado' },
        { status: 404 }
      );
    }

    // Buscar informações do mentee (usuário atual)
    const { data: menteeProfile, error: menteeError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    if (menteeError || !menteeProfile) {
      return NextResponse.json(
        { error: 'Perfil do usuário não encontrado' },
        { status: 404 }
      );
    }

    // Gerar token de ação seguro
    const actionToken = crypto.randomBytes(32).toString('hex');

    // Criar appointment no banco
    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        mentor_id: mentorId,
        mentee_id: user.id,
        scheduled_at: scheduledAt,
        duration_minutes: duration,
        status: 'pending',
        notes: message,
        action_token: actionToken,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[APPOINTMENT] Erro ao criar agendamento:', insertError);
      return NextResponse.json(
        { error: 'Erro ao criar agendamento' },
        { status: 500 }
      );
    }

    // Enviar email ao mentor
    try {
      await sendAppointmentRequest({
        mentorEmail: mentorProfile.email,
        mentorName: mentorProfile.full_name,
        menteeName: menteeProfile.full_name,
        scheduledAt,
        message,
        token: actionToken,
      });
    } catch (emailError) {
      console.error('[APPOINTMENT] Erro ao enviar email, mas agendamento foi criado:', emailError);
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
