
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// Admin client com service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json()

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "Nenhum usuário selecionado" }, { status: 400 })
    }

    console.log(`🚀 Iniciando envio de convites para ${userIds.length} usuários...`)

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Processar em série para respeitar limites de API/SMTP e garantir controle
    for (const userId of userIds) {
      try {
        // 1. Buscar o e-mail do usuário
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single()

        if (profileError || !profile) {
          throw new Error(`Perfil não encontrado para ID ${userId}`)
        }

        // 2. Disparar e-mail de recuperação de senha (que serve como convite)
        const { error: inviteError } = await supabaseAdmin.auth.resetPasswordForEmail(profile.email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://menvo.com.br'}/auth/callback?type=recovery`
        })

        if (inviteError) throw inviteError

        // 3. Marcar data de envio no perfil
        await supabaseAdmin
          .from('profiles')
          .update({ invite_sent_at: new Date().toISOString() })
          .eq('id', userId)

        results.success++
      } catch (err: any) {
        console.error(`❌ Falha ao convidar ${userId}:`, err.message)
        results.failed++
        results.errors.push(`${userId}: ${err.message}`)
      }
    }

    return NextResponse.json({
      message: `Processo finalizado. Sucessos: ${results.success}, Falhas: ${results.failed}`,
      results
    })

  } catch (error: any) {
    console.error("Erro na API de convite:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
