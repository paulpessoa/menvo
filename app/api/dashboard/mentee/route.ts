import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"

/**
 * Consolidated data for the mentee dashboard: totals, the next few
 * confirmed/pending sessions, and whether a completed session is still
 * waiting for this mentee's evaluation (gates new bookings — see
 * `BookMentorshipModal`).
 *
 * One request instead of three separate Supabase reads from the client.
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

    const [{ data: appointments, error: aptError }, { data: feedbacks, error: fbError }] = await Promise.all([
      supabase
        .from("appointments")
        .select("id, status, scheduled_at, duration_minutes, mentor_id, google_meet_link, mentor:profiles!mentor_id(full_name, avatar_url, job_title)")
        .eq("mentee_id", user.id),
      supabase.from("appointment_feedbacks").select("appointment_id").eq("reviewer_id", user.id)
    ])

    if (aptError) {
      console.error("[DASHBOARD/mentee] Erro ao buscar agendamentos:", aptError)
      return NextResponse.json({ error: "Erro ao buscar agendamentos" }, { status: 500 })
    }
    if (fbError) {
      console.error("[DASHBOARD/mentee] Erro ao buscar avaliações:", fbError)
    }

    const apts = appointments || []
    const now = new Date()

    const upcomingCount = apts.filter((a) => new Date(a.scheduled_at) > now && a.status !== "cancelled").length
    const completed = apts.filter((a) => a.status === "completed")
    const totalMinutes = completed.reduce((sum, a) => sum + (a.duration_minutes || 0), 0)
    const totalMentors = new Set(apts.map((a) => a.mentor_id)).size

    const stats = {
      totalAppointments: apts.length,
      upcomingAppointments: upcomingCount,
      completedSessions: completed.length,
      totalMentors,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10
    }

    const upcoming = apts
      .filter((a) => new Date(a.scheduled_at) >= now && a.status !== "cancelled")
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .slice(0, limit)
      .map((a) => {
        const mentor = Array.isArray(a.mentor) ? a.mentor[0] : a.mentor
        return {
          id: a.id,
          scheduled_at: a.scheduled_at,
          duration_minutes: a.duration_minutes,
          status: a.status,
          google_meet_link: a.google_meet_link || null,
          mentor: {
            full_name: mentor?.full_name || "Mentor",
            avatar_url: mentor?.avatar_url || null,
            job_title: mentor?.job_title || null
          }
        }
      })

    const feedbackIds = new Set((feedbacks || []).map((f) => f.appointment_id))
    const hasPendingEvaluations = completed.some((a) => !feedbackIds.has(a.id))

    return NextResponse.json({ stats, upcoming, hasPendingEvaluations })
  } catch (error) {
    console.error("[DASHBOARD/mentee] Erro inesperado:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
