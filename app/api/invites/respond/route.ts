import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit } from "@/lib/rate-limit"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { resolveInviteToken, markResponse } from "@/lib/services/invites/invite-token.service"
import { suppress } from "@/lib/services/invites/suppression.service"

const bodySchema = z.object({
  token: z.string().trim().min(20).max(200),
  action: z.enum(["accept", "accept_mentor", "opt_out"])
})

const ACTION_TO_RESPONSE = {
  accept: "accepted",
  accept_mentor: "accepted_mentor",
  opt_out: "opted_out"
} as const

/**
 * The only write a reengagement invite link can trigger without a login
 * — and only from a POST the recipient explicitly clicked, never from
 * just opening the page (see docs/domains/reengagement-invites.md §3.2).
 * Deletion has its own endpoint (/api/invites/delete) with an extra
 * confirmation step, since it's the one irreversible action here.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkRateLimit(`invite-respond:${ip}`, { maxRequests: 20, windowMs: 60_000 })
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Muitas tentativas. Tente novamente em instantes." }, { status: 429 })
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid" }, { status: 400 })
    }

    const resolved = await resolveInviteToken(parsed.data.token)
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.reason }, { status: 400 })
    }

    const { invite, profile } = resolved
    const response = ACTION_TO_RESPONSE[parsed.data.action]

    const recorded = await markResponse(invite.id, response)
    if (!recorded) {
      return NextResponse.json({ error: "already_responded" }, { status: 409 })
    }

    if (parsed.data.action === "opt_out") {
      const supabase = createServiceRoleClient()
      await supabase.from("profiles").update({ email_opt_out_at: new Date().toISOString() }).eq("id", profile.id)
      await suppress(profile.email, "opted_out")
      return NextResponse.json({ success: true })
    }

    // accept / accept_mentor: hand the recipient a fresh recovery link —
    // generated on click, so it's never stale even if the invite e-mail
    // sat unread for weeks (unlike the token in the URL, this link still
    // only lives a few hours, but the person is using it right now).
    const supabase = createServiceRoleClient()
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.menvo.com.br"}/update-password`
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: profile.email,
      options: { redirectTo }
    })

    if (linkError || !linkData?.properties?.action_link) {
      return NextResponse.json({ error: "Não foi possível gerar o link de acesso" }, { status: 502 })
    }

    return NextResponse.json({ success: true, redirectUrl: linkData.properties.action_link })
  } catch (error) {
    console.error("[API INVITES RESPOND] Erro:", error)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
