import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { handleApiError } from "@/lib/api/error-handler"
import { listActivityLogs } from "@/lib/services/admin/activity-logs.service"
import { activityQuerySchema } from "@/lib/services/admin/activity-logs.types"

/** GET /api/admin/activity-logs?search=&table=&page= - admin-only activity trail. */
export async function GET(request: NextRequest) {
  try {
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

    const supabase = await createClient()
    return NextResponse.json(await listActivityLogs(supabase, parsed.data))
  } catch (error) {
    return handleApiError(error)
  }
}
