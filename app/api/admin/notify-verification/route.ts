
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { sendVerificationNotification } from "@/lib/email/brevo"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Validar se o solicitante é um admin
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !adminUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Usar uma query direta para verificar se é admin
    const { data: roleData } = await (supabase
      .from('user_roles' as any)
      .select('roles(name)')
      .eq('user_id', adminUser.id)
      .single() as any)

    if (roleData?.roles?.name !== 'admin') {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // 2. Parse Body
    const body = await request.json()
    const { userId, status, notes } = body as { 
      userId: string, 
      status: 'approved' | 'rejected', 
      notes?: string 
    }

    if (!userId || !status) {
      return NextResponse.json({ error: "Dados obrigatórios faltando" }, { status: 400 })
    }

    // 3. Buscar informações do usuário alvo
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single()

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: "Usuário alvo não encontrado" }, { status: 404 })
    }

    const profile = targetProfile as any;

    // 4. Enviar e-mail formatado via Brevo
    await sendVerificationNotification({
      userEmail: profile.email,
      userName: profile.full_name || "Mentor",
      status,
      notes
    })

    console.log(`✅ [NOTIFY] E-mail enviado para ${profile.email} com status ${status}`)

    return NextResponse.json({ success: true, message: "Notificação enviada com sucesso" })
  } catch (error: any) {
    console.error("❌ [NOTIFY] Erro ao notificar usuário:", error)
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 })
  }
}
