import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth/require-admin"
import { buildReengagementInviteHtml } from "@/lib/email/brevo"

const bodySchema = z.object({
  body: z.string().trim().min(1).max(10000)
})

/**
 * Renders the reengagement e-mail HTML with placeholder data, so the
 * admin modal's preview step is exactly what `buildReengagementInviteHtml`
 * produces for a real send — same function, fake name/token.
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "O corpo do e-mail é obrigatório" }, { status: 400 })
    }

    const html = buildReengagementInviteHtml({
      name: "Mariana Silva",
      bodyText: parsed.data.body,
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br"}/convite/preview-token`
    })

    return NextResponse.json({ html })
  } catch (error) {
    console.error("[API INVITES PREVIEW] Erro:", error)
    const message = error instanceof Error ? error.message : "Erro interno do servidor"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
