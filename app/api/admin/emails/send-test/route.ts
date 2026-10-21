import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { emailSendTestBodySchema } from "@/lib/schemas/admin"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { buildAdminEmailsService } from "@/lib/services/admin/ops.composition"

/** POST /api/admin/emails/send-test - envia um modelo de e-mail de teste. */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const validation = emailSendTestBodySchema.safeParse(await request.json().catch(() => null))
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || "Dados inválidos." },
      { status: 400 }
    )
  }

  try {
    const { email, template } = validation.data
    const service = buildAdminEmailsService(await createClient())
    const result = await service.sendTest(email, template)

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
  } catch (error) {
    const forbidden = adminForbiddenResponse(error)
    if (forbidden) return forbidden
    console.error("[API send-test] Erro inesperado:", error)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
