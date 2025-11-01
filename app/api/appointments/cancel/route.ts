import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

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

    const body = await request.json();
    const { appointmentId, reason } = body;

    console.log('[CANCEL] Request body:', { appointmentId, reason, userId: user.id });

    if (!appointmentId || !reason) {
      return NextResponse.json(
        { error: 'appointmentId e reason são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('[CANCEL] Cancelando appointment:', appointmentId, 'Reason:', reason);

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

    console.log('[CANCEL] Update data:', updateData);

    const { error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId);

    if (updateError) {
      console.error('[CANCEL] Erro ao cancelar appointment:', updateError);
      console.error('[CANCEL] Error details:', JSON.stringify(updateError, null, 2));
      return NextResponse.json(
        { error: 'Erro ao cancelar agendamento', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('[CANCEL] ✅ Appointment cancelado com sucesso');

    // TODO: Remover evento do Google Calendar se existir
    // TODO: Enviar email de notificação

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
