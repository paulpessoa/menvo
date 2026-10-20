import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { reportsQuerySchema } from "@/lib/schemas/admin"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { getAdminReport } from "@/lib/services/admin/admin-reports.service"

/**
 * GET /api/admin/reports?since=YYYY-MM-DD - overview counts and daily
 * signup growth for /dashboard/admin/reports.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const query = reportsQuerySchema.safeParse({
    since: request.nextUrl.searchParams.get("since") || undefined
  })
  if (!query.success) {
    return NextResponse.json({ error: "since deve ser YYYY-MM-DD" }, { status: 400 })
  }

  try {
    return NextResponse.json(await getAdminReport(await createClient(), query.data.since))
  } catch (error) {
    const forbidden = adminForbiddenResponse(error)
    if (forbidden) return forbidden
    console.error("[GET /api/admin/reports] Error:", error)
    return NextResponse.json({ error: "Não foi possível carregar os relatórios" }, { status: 500 })
  }
}
