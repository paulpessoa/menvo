import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"

/**
 * Single source of the numbers shown on /dashboard/admin (the summary cards)
 * and echoed by /dashboard/admin/users (tab badges) and
 * /dashboard/admin/verifications (queue count). Before this, the dashboard
 * computed "Mentores Pendentes" from `profiles.verified` while the other two
 * screens used `verification_status = 'pending'` — same word, two different
 * counts, so the number on the card never matched what you found inside.
 *
 * "Pending" here always means verification_status = 'pending' (see
 * docs/domains/mentor-verification.md): a candidate stays role `mentee`
 * until approved, so counting by role `mentor` would miss them entirely.
 */
export async function GET() {
  try {
    const guard = await requireAdmin(["admin", "moderator"])
    if (!guard.ok) return guard.response

    const supabase = await createClient()

    const [
      { count: totalUsers },
      { count: pendingMentors },
      { count: totalMentors },
      { count: verifiedMentors },
      { count: totalMentees },
      { count: totalSessions },
      { count: recentSignups },
      { count: waitingList }
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
      supabase
        .from("profiles")
        .select("user_roles!inner(roles!inner(name))", { count: "exact", head: true })
        .eq("user_roles.roles.name", "mentor"),
      supabase
        .from("profiles")
        .select("user_roles!inner(roles!inner(name))", { count: "exact", head: true })
        .eq("user_roles.roles.name", "mentor")
        .eq("verified", true),
      supabase
        .from("profiles")
        .select("user_roles!inner(roles!inner(name))", { count: "exact", head: true })
        .eq("user_roles.roles.name", "mentee"),
      supabase.from("appointments").select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from("waiting_list").select("*", { count: "exact", head: true }).neq("status", "registered")
    ])

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalMentors: totalMentors || 0,
      verifiedMentors: verifiedMentors || 0,
      pendingMentors: pendingMentors || 0,
      totalMentees: totalMentees || 0,
      totalSessions: totalSessions || 0,
      recentSignups: recentSignups || 0,
      waitingList: waitingList || 0
    })
  } catch (error) {
    console.error("[ADMIN STATS] Erro:", error)
    return NextResponse.json({ error: "Erro ao carregar estatísticas" }, { status: 500 })
  }
}
