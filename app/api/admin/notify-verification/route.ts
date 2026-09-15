
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { sendVerificationNotification } from "@/lib/email/brevo"
import { requireAdmin } from "@/lib/auth/require-admin"

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const supabase = await createClient()

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

    return NextResponse.json({ success: true, message: "Notificação enviada com sucesso" })
  } catch (error: any) {
    console.error("❌ [NOTIFY] Erro ao notificar usuário:", error)
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 })
  }
}
