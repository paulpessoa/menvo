import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getOrCreateConversation, sendMessage } from '@/lib/chat/chat-service';

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
    const { mentorId, content } = body;

    // Validação básica
    if (!mentorId || !content) {
      return NextResponse.json(
        { error: 'mentorId e content são obrigatórios' },
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Mensagem não pode estar vazia' },
        { status: 400 }
      );
    }

    // Verificar se o outro usuário existe
    // Não precisamos verificar chat_enabled aqui porque a conversa já existe
    const { data: otherUserProfile, error: otherUserError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', mentorId)
      .single();

    if (otherUserError || !otherUserProfile) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Buscar ou criar conversa
    const conversationId = await getOrCreateConversation(supabase, mentorId, user.id);
    console.log('[CHAT API] Conversa ID:', conversationId);

    // Enviar mensagem
    const message = await sendMessage(supabase, conversationId, user.id, content);
    console.log('[CHAT API] Mensagem criada:', message);

    return NextResponse.json({
      success: true,
      messageId: message.id,
      conversationId,
      message, // Retornar a mensagem completa para debug
    });
  } catch (error) {
    console.error('[CHAT] Erro ao enviar mensagem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
