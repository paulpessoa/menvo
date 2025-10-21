import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getOrCreateConversation, getMessages } from '@/lib/chat/chat-service';

interface RouteParams {
  params: {
    mentorId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[CHAT] Erro de autenticação:', authError);
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { mentorId } = params;
    console.log('[CHAT] Buscando conversa entre:', { mentorId, userId: user.id });

    // Buscar ou criar conversa
    const conversationId = await getOrCreateConversation(mentorId, user.id);
    console.log('[CHAT] Conversa encontrada/criada:', conversationId);

    // Buscar mensagens
    const messages = await getMessages(conversationId);
    console.log('[CHAT] Mensagens encontradas:', messages.length);

    return NextResponse.json({
      success: true,
      conversationId,
      messages,
    });
  } catch (error) {
    console.error('[CHAT] Erro ao buscar mensagens:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errorMessage },
      { status: 500 }
    );
  }
}
