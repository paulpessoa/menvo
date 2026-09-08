import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { sendTestEmail } from "@/lib/email/brevo"

const sendTestSchema = z.object({
  email: z.string().email("Por favor, insira um e-mail válido."),
  template: z.string().min(1, "Template é obrigatório.")
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const validation = sendTestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Dados inválidos." },
        { status: 400 }
      )
    }

    const { email, template } = validation.data
    const result = await sendTestEmail({ to: email, templateKey: template })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Falha ao enviar e-mail de teste pelo Brevo." },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `E-mail de teste (${template}) enviado com sucesso para ${email}!`
    })
  } catch (error: any) {
    console.error("[API send-test] Erro inesperado:", error)
    return NextResponse.json(
      { error: error?.message || "Erro interno do servidor." },
      { status: 500 }
    )
  }
}
