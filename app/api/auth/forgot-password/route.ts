import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { z } from "zod"

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    })

    if (error) {
      console.error("Erro ao enviar email de recuperação:", error)
      return NextResponse.json({ error: "Erro ao enviar email de recuperação" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Email de recuperação enviado com sucesso!",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("Erro ao processar recuperação de senha:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
