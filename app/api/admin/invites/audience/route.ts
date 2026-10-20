import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { inviteAudienceBodySchema } from "@/lib/schemas/admin"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { buildAdminInvitesService } from "@/lib/services/admin/ops.composition"

/**
 * Counts who a reengagement campaign would actually reach for a given
 * audience - before anything is sent. The admin modal calls this on
 * every audience/resend change so the confirmation step always shows a
 * true number, never a guess.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const parsed = inviteAudienceBodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Parâmetros inválidos", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const service = buildAdminInvitesService(await createClient(), request)
    const { eligible, skipped } = await service.resolveAudience(parsed.data)

    // Returns the actual id list (not just a count): the admin modal
    // drives the send loop client-side in batches of 25
    // (POST /api/admin/invites/send), so it needs these ids to batch -
    // there's no "send this whole audience" endpoint that resolves the
    // list twice.
    return NextResponse.json({
      eligibleUserIds: eligible.map(p => p.id),
      skipped
    })
  } catch (error) {
    const forbidden = adminForbiddenResponse(error)
    if (forbidden) return forbidden
    console.error("[API INVITES AUDIENCE] Erro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
