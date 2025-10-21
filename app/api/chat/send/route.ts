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

    // Verificar se o mentor tem chat habilitado
    const { data: mentorProfile, error: mentorError } = await supabase
      .from('profiles')
      .select('chat_enabled')
      .eq('id', mentorId)
      .single();

    if (mentorError || !mentorProfile) {
      return NextResponse.json(
        { error: 'Mentor não encontrado' },
        { status: 404 }
      );
    }

    if (!mentorProfile.chat_enabled) {
      return NextResponse.json(
        { error: 'Chat não habilitado para este mentor' },
        { status: 403 }
      );
    }

    // Buscar ou criar conversa
    const conversationId = await getOrCreateConversation(mentorId, user.id);

    // Enviar mensagem
    const message = await sendMessage(conversationId, user.id, content);

    return NextResponse.json({
      success: true,
      messageId: message.id,
      conversationId,
    });
  } catch (error) {
    console.error('[CHAT] Erro ao enviar mensagem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
