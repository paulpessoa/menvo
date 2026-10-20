import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { loadAdminOverview } from "@/lib/services/admin/ops.composition"

/**
 * GET /api/admin/overview - aggregated, chart-ready numbers for
 * /dashboard/admin (growth, sessions, mentor pipeline, ratings, AI spend,
 * organizations, LGPD retention). Raw rows never leave the server.
 */
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  try {
    const overview = await loadAdminOverview(await createClient())
    return NextResponse.json(overview, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    const forbidden = adminForbiddenResponse(error)
    if (forbidden) return forbidden
    console.error("[GET /api/admin/overview] Erro:", error)
    return NextResponse.json({ error: "Não foi possível carregar a visão geral" }, { status: 500 })
  }
}
