import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { createInviteToken } from "@/lib/services/invites/invite-token.service"
import { sendReengagementInvite } from "@/lib/email/brevo"
import { logAdminAction } from "@/lib/audit-logger"

const bodySchema = z.object({
  campaign: z.string().trim().min(1).max(100),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10000),
  userIds: z.array(z.string().uuid()).min(1).max(25),
  resend: z.boolean().optional()
})

/**
 * Sends one batch (≤25, enforced above — keeps each call well under the
 * Vercel function timeout) of a reengagement campaign. The admin modal
 * calls this once per batch across the full audience, showing progress
 * between calls. Idempotent per (user, campaign) unless `resend` is set:
 * `createInviteToken`'s upsert either creates the first token or rotates
 * an existing one.
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "Parâmetros inválidos", details: parsed.error.flatten() }, { status: 400 })
    }

    const { campaign, subject, body, userIds, resend } = parsed.data
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br"
    const supabase = createServiceRoleClient()

    const results: { userId: string; success: boolean; error?: string }[] = []

    for (const userId of userIds) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .eq("id", userId)
          .maybeSingle()

        if (profileError || !profile?.email) {
          throw new Error("Perfil sem e-mail cadastrado")
        }

        const { token } = await createInviteToken({
          userId,
          campaign,
          subject,
          sentBy: guard.admin.userId,
          resend
        })

        const emailResult = await sendReengagementInvite({
          name: profile.full_name || profile.email,
          email: profile.email,
          subject,
          bodyText: body,
          inviteUrl: `${appUrl}/convite/${token}`
        })

        if (!emailResult.success) throw new Error(emailResult.error || "Falha ao enviar e-mail")

        await supabase.from("profiles").update({ invite_sent_at: new Date().toISOString() }).eq("id", userId)

        results.push({ userId, success: true })
      } catch (err: any) {
        results.push({ userId, success: false, error: err?.message || "Erro desconhecido" })
      }
    }

    const successCount = results.filter(r => r.success).length

    await logAdminAction(
      guard.admin.userId,
      "bulk_action",
      { campaign, subject, count: userIds.length, success: successCount, failed: userIds.length - successCount },
      undefined,
      undefined,
      request
    )

    return NextResponse.json({ results, success: successCount, failed: userIds.length - successCount })
  } catch (error) {
    console.error("[API INVITES SEND] Erro:", error)
    const message = error instanceof Error ? error.message : "Erro interno do servidor"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
