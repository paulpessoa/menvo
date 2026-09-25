import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit } from "@/lib/rate-limit"
import { resolveInviteToken, markResponse } from "@/lib/services/invites/invite-token.service"
import { deleteUserCompletely } from "@/lib/services/admin/delete-user.service"

const bodySchema = z.object({
  token: z.string().trim().min(20).max(200),
  confirm: z.literal(true)
})

/**
 * Permanently deletes the account behind an invite token — no login
 * required, LGPD art. 18 self-service. `confirm: true` is required in
 * the body (the public page has its own explicit confirmation screen
 * before calling this) and this is a POST reached only by an explicit
 * click, never by opening a link (§3.2 of the design doc). The user_id
 * comes exclusively from the resolved token, never from the request —
 * this endpoint cannot be pointed at an arbitrary account.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkRateLimit(`invite-delete:${ip}`, { maxRequests: 10, windowMs: 60_000 })
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

    const recorded = await markResponse(invite.id, "deleted")
    if (!recorded) {
      return NextResponse.json({ error: "already_responded" }, { status: 409 })
    }

    await deleteUserCompletely(profile.id, { source: "invite_token", campaign: invite.campaign })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API INVITES DELETE] Erro:", error)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
