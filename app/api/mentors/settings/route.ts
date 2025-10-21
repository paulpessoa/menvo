import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PATCH(request: NextRequest) {
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
    const { chatEnabled } = body;

    if (typeof chatEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'chatEnabled deve ser um boolean' },
        { status: 400 }
      );
    }

    // Atualizar configuração
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ chat_enabled: chatEnabled })
      .eq('id', user.id);

    if (updateError) {
      console.error('[SETTINGS] Erro ao atualizar chat_enabled:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar configuração' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      chatEnabled,
    });
  } catch (error) {
    console.error('[SETTINGS] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
