import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('action_token', token)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado ou token inválido' },
        { status: 404 }
      );
    }

    // Verificar se já foi processado
    if (appointment.status !== 'pending') {
      return NextResponse.json(
        { error: `Agendamento já foi ${appointment.status === 'confirmed' ? 'confirmado' : 'cancelado'}` },
        { status: 400 }
      );
    }

    // Atualizar status
    const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
    const updateData: any = { status: newStatus };
    
    if (action === 'cancel' && reason) {
      updateData.notes = `${appointment.notes}\n\n[Cancelado] Motivo: ${reason}`;
    }

    const { error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointment.id);

    if (updateError) {
      console.error('[APPOINTMENT] Erro ao atualizar:', updateError);
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
