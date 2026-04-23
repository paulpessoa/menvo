import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import type { Database } from '@/lib/types/supabase';

type AppointmentRow = Database['public']['Tables']['appointments']['Row'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { token, action, reason } = body;

    if (!token || !action) {
      return NextResponse.json({ error: 'Token e ação são obrigatórios' }, { status: 400 });
    }

    if (!['confirm', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    // Buscar appointment pelo token
    const { data: appointmentDataResult, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('action_token', token)
      .single();

    if (fetchError || !appointmentDataResult) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado ou token inválido' },
        { status: 404 }
      );
    }

    const appointment = appointmentDataResult as AppointmentRow;

    // Verificar se já foi processado
    if (appointment.status !== 'pending') {
      return NextResponse.json(
        { error: `Agendamento já foi ${appointment.status === 'confirmed' ? 'confirmado' : 'cancelado'}` },
        { status: 400 }
      );
    }

    // Atualizar status
    const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
    const updateData: Partial<AppointmentRow> = { 
      status: newStatus,
      cancellation_reason: action === 'cancel' ? reason : null,
      cancelled_at: action === 'cancel' ? new Date().toISOString() : null,
    };

    const { error: updateError } = await (supabase
      .from('appointments') as any)
      .update(updateData)
      .eq('id', appointment.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao processar ação' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: action === 'confirm' 
        ? 'Agendamento confirmado com sucesso!' 
        : 'Agendamento cancelado',
    });
  } catch (error) {
    console.error('[APPOINTMENT] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
