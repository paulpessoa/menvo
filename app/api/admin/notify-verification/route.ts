import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendVerificationNotification } from '@/lib/email/brevo'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verificar Auth & Admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)
      .single()

    if ((roleData?.roles as any)?.name !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // 2. Parse Body
    const { userId, status, notes } = await request.json()

    // 3. Buscar dados do usuário alvo
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (userError || !targetUser) throw new Error('Usuário não encontrado')

    // 4. Enviar E-mail via Brevo
    await sendVerificationNotification({
      userEmail: targetUser.email,
      userName: targetUser.full_name || 'Usuário Menvo',
      status,
      notes
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API NOTIFY] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
