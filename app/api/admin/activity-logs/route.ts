import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { listActivityLogs } from "@/lib/services/admin/activity-logs.service"
import { activityQuerySchema } from "@/lib/services/admin/activity-logs.types"

/** GET /api/admin/activity-logs?search=&table=&page= - admin-only activity trail. */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const sp = new URL(request.url).searchParams
  const parsed = activityQuerySchema.safeParse({
    search: sp.get("search") ?? undefined,
    table: sp.get("table") || undefined,
    page: sp.get("page") ?? undefined
  })
  if (!parsed.success) {
    return NextResponse.json({ error: "Parâmetros inválidos", code: "BAD_REQUEST" }, { status: 400 })
  }

  try {
    return NextResponse.json(await listActivityLogs(await createClient(), parsed.data))
  } catch (error) {
    const forbidden = adminForbiddenResponse(error)
    if (forbidden) return forbidden
    console.error("[GET /api/admin/activity-logs] Error:", error)
    return NextResponse.json({ error: "Erro ao carregar logs de atividade" }, { status: 500 })
  }
}
