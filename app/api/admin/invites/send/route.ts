import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { inviteSendBodySchema } from "@/lib/schemas/admin"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { buildAdminInvitesService } from "@/lib/services/admin/ops.composition"

/**
 * Sends one batch (≤25, enforced by the schema - keeps each call well under the
 * Vercel function timeout) of a reengagement campaign. The admin modal
 * calls this once per batch across the full audience, showing progress
 * between calls. Idempotent per (user, campaign) unless `resend` is set:
 * the token upsert either creates the first token or rotates an existing one.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const parsed = inviteSendBodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Parâmetros inválidos", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const service = buildAdminInvitesService(await createClient(), request)
    const result = await service.sendBatch(guard.admin.userId, parsed.data)
    return NextResponse.json(result)
  } catch (error) {
    const forbidden = adminForbiddenResponse(error)
    if (forbidden) return forbidden
    console.error("[API INVITES SEND] Erro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
