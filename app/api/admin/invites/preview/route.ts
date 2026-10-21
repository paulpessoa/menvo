import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { invitePreviewBodySchema } from "@/lib/schemas/admin"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { buildAdminInvitesService } from "@/lib/services/admin/ops.composition"

/**
 * Renders the reengagement e-mail HTML with placeholder data, so the
 * admin modal's preview step is exactly what the real send produces -
 * same template, fake name/token.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const parsed = invitePreviewBodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "O corpo do e-mail é obrigatório" }, { status: 400 })
  }

  try {
    const service = buildAdminInvitesService(await createClient(), request)
    return NextResponse.json({ html: await service.previewInvite(parsed.data.body) })
  } catch (error) {
    const forbidden = adminForbiddenResponse(error)
    if (forbidden) return forbidden
    console.error("[API INVITES PREVIEW] Erro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
