import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { buildAdminRetentionService } from "@/lib/services/admin/ops.composition"

/**
 * GET /api/admin/retention - filas de retenção LGPD e de contas inativas com
 * os números dos cards. Lê pela sessão do admin (policies `is_admin()`).
 */
export async function GET() {
  const guard = await requireAdmin(["admin"])
  if (!guard.ok) return guard.response

  try {
    const service = buildAdminRetentionService(await createClient())
    const { stats, queue, inactiveStats, inactiveQueue } = await service.getRetentionOverview()
    return NextResponse.json({ success: true, stats, queue, inactiveStats, inactiveQueue })
  } catch (error) {
    const forbidden = adminForbiddenResponse(error)
    if (forbidden) return forbidden
    console.error("[GET /api/admin/retention] Error:", error)
    return NextResponse.json({ error: "Não foi possível carregar a retenção" }, { status: 500 })
  }
}
