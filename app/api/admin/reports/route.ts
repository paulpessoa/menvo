import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"

/**
 * GET /api/admin/reports?since=YYYY-MM-DD - overview counts and daily
 * signup growth for /dashboard/admin/reports. Moved from
 * `adminReportsService`, which queried `profiles`/`user_roles` straight
 * from the browser (docs/COMMUNITY_CONTACT_PLAN.md §13).
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const since = request.nextUrl.searchParams.get("since") || "2020-01-01"

  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: totalMentors },
    { count: totalMentees },
    { data: growthRows, error: growthError }
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("user_roles!inner(roles!inner(name))", { count: "exact", head: true })
      .eq("user_roles.roles.name", "mentor"),
    supabase
      .from("profiles")
      .select("user_roles!inner(roles!inner(name))", { count: "exact", head: true })
      .eq("user_roles.roles.name", "mentee"),
    supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
  ])

  if (growthError) {
    console.error("[GET /api/admin/reports] Erro ao buscar crescimento:", growthError.message)
    return NextResponse.json({ error: "Não foi possível carregar os relatórios" }, { status: 500 })
  }

  const counts: Record<string, number> = {}
  for (const row of growthRows || []) {
    if (!row?.created_at) continue
    const date = new Date(row.created_at)
    if (isNaN(date.getTime())) continue
    const dateKey = date.toISOString().split("T")[0]
    counts[dateKey] = (counts[dateKey] || 0) + 1
  }
  const growth = Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json({
    overview: {
      totalUsers: totalUsers || 0,
      totalMentors: totalMentors || 0,
      totalMentees: totalMentees || 0
    },
    growth: { users: growth }
  })
}
