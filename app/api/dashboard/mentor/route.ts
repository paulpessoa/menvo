import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"

/**
 * Consolidated data for the mentor dashboard: totals and the next few
 * confirmed/pending sessions. See `/api/dashboard/mentee` for the mentee
 * equivalent and the rationale for one request instead of several.
 */
export async function GET(request: NextRequest) {
  try {
    const serverSupabase = await createServerClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const limit = Math.min(Math.max(parseInt(request.nextUrl.searchParams.get("limit") || "3", 10) || 3, 1), 20)
    const supabase = createServiceRoleClient()

    const { data: appointments, error: aptError } = await supabase
      .from("appointments")
      .select("id, status, scheduled_at, duration_minutes, mentee_id, google_meet_link, mentee:profiles!mentee_id(full_name, avatar_url, job_title)")
      .eq("mentor_id", user.id)

    if (aptError) {
      console.error("[DASHBOARD/mentor] Erro ao buscar agendamentos:", aptError)
      return NextResponse.json({ error: "Erro ao buscar agendamentos" }, { status: 500 })
    }

    const apts = appointments || []
    const now = new Date()

    const upcomingCount = apts.filter((a) => new Date(a.scheduled_at) > now && a.status !== "cancelled").length
    const pending = apts.filter((a) => a.status === "pending" && new Date(a.scheduled_at) > now).length
    const completed = apts.filter((a) => a.status === "completed")
    const totalMinutes = completed.reduce((sum, a) => sum + (a.duration_minutes || 0), 0)
    const totalMentees = new Set(apts.filter((a) => a.status !== "cancelled").map((a) => a.mentee_id)).size

    const stats = {
      totalAppointments: apts.length,
      upcomingAppointments: upcomingCount,
      pendingRequests: pending,
      completedSessions: completed.length,
      totalMentees,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10
    }

    const upcoming = apts
      .filter((a) => new Date(a.scheduled_at) >= now && a.status !== "cancelled")
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .slice(0, limit)
      .map((a) => {
        const mentee = Array.isArray(a.mentee) ? a.mentee[0] : a.mentee
        return {
          id: a.id,
          scheduled_at: a.scheduled_at,
          duration_minutes: a.duration_minutes,
          status: a.status,
          google_meet_link: a.google_meet_link || null,
          mentee: {
            full_name: mentee?.full_name || "Mentorado",
            avatar_url: mentee?.avatar_url || null,
            job_title: mentee?.job_title || null
          }
        }
      })

    return NextResponse.json({ stats, upcoming })
  } catch (error) {
    console.error("[DASHBOARD/mentor] Erro inesperado:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
