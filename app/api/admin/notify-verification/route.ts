import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { sendMessage, getOrCreateConversation } from '@/lib/chat/chat-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verificar se é admin
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: roleData } = await supabase
      .from('user_roles' as any)
      .select('roles(name)')
      .eq('user_id', user.id)
      .single()

    const roles = (roleData as any)?.user_roles?.map((ur: any) => ur.roles?.name) || []
    if (!roles.includes('admin')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { userId, adminId, status, notes } = await request.json()

    // 2. Buscar dados do usuário alvo
    const { data: targetUser, error: userError } = await supabase
      .from('profiles' as any)
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // 3. Preparar mensagem de chat
    const messageContent = status === 'approved' 
      ? `🎉 Parabéns! Seu perfil de mentor foi aprovado. Agora você já pode configurar sua agenda e aparecer no diretório.`
      : `⚠️ Olá! Seu perfil de mentor precisa de alguns ajustes: ${notes || 'Veja os detalhes no seu perfil.'}`

    const conversationId = await getOrCreateConversation(supabase, userId, adminId)
    await sendMessage(supabase, conversationId, adminId, messageContent)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
