import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { retentionExemptBodySchema } from "@/lib/schemas/admin"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { buildAdminRetentionService } from "@/lib/services/admin/ops.composition"

/**
 * POST /api/admin/retention/exempt - isenta um usuário da fila de retenção
 * LGPD (JotForm): a origem passa a `menvo`, os dados importados ficam e o
 * registro sai de `account_retention`. Grava auditoria.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin(["admin"])
  if (!guard.ok) return guard.response

  const body = retentionExemptBodySchema.safeParse(await request.json().catch(() => null))
  if (!body.success) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  try {
    const service = buildAdminRetentionService(await createClient())
    await service.exemptFromRetention(guard.admin.userId, body.data.userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    const forbidden = adminForbiddenResponse(error)
    if (forbidden) return forbidden
    console.error("[POST /api/admin/retention/exempt] Error:", error)
    return NextResponse.json({ error: "Não foi possível isentar o usuário" }, { status: 500 })
  }
}
