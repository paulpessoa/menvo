import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"

export type NotificationType =
  | "booking_request"
  | "booking_confirmed"
  | "booking_cancelled"
  | "pending_evaluation"
  | "session_starting_soon"

export interface InAppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  actionUrl: string
}

/**
 * GET /api/me/notifications?role=mentor|mentee - in-app notifications
 * derived from the caller's own appointments and reviews. Replaces
 * `notificationsService.getUserNotifications`, which queried `appointments`
 * straight from the browser with a client-supplied `userId`
 * (docs/COMMUNITY_CONTACT_PLAN.md §13).
 *
 * `userId` is always the session's own id; `role` is only a hint that picks
 * which notification categories to compute (a wrong value just omits/adds a
 * category, since every query below is still scoped to `auth.uid()`).
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const role = request.nextUrl.searchParams.get("role")
  const userId = user.id

  try {
    const { data: appointments, error } = await (supabase.from("appointments") as any)
      .select(
        `
        id,
        mentor_id,
        mentee_id,
        scheduled_at,
        duration_minutes,
        status,
        topic,
        notes_mentor,
        created_at,
        updated_at,
        mentor:profiles!mentor_id(id, full_name, avatar_url),
        mentee:profiles!mentee_id(id, full_name, avatar_url)
      `
      )
      .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)
      .order("updated_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("[GET /api/me/notifications] Erro ao buscar agendamentos:", error)
      return NextResponse.json({ notifications: [] })
    }

    const rawList = (appointments as any[]) || []
    const notifications: InAppNotification[] = []

    let reviewedAppointmentIds = new Set<string | number>()
    if (role !== "mentor") {
      const { data: feedbacks } = await (supabase.from("appointment_feedbacks") as any)
        .select("appointment_id")
        .eq("reviewer_id", userId)

      reviewedAppointmentIds = new Set((feedbacks || []).map((f: any) => f.appointment_id))
    }

    const now = new Date()

    for (const apt of rawList) {
      const isMentor = apt.mentor_id === userId
      const counterpart = isMentor ? apt.mentee : apt.mentor
      const counterpartName = counterpart?.full_name || (isMentor ? "Mentorado(a)" : "Mentor(a)")

      const scheduledDate = new Date(apt.scheduled_at)
      const dateFormatted = scheduledDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })

      if (isMentor && apt.status === "pending") {
        notifications.push({
          id: `booking-request-${apt.id}`,
          type: "booking_request",
          title: "Nova solicitação de mentoria",
          message: `${counterpartName} solicitou uma mentoria para ${dateFormatted}.`,
          timestamp: apt.created_at || apt.updated_at,
          actionUrl: "/mentorship/mentor#action",
        })
      }

      if (apt.status === "confirmed") {
        const isUpcoming = scheduledDate > now

        if (isUpcoming) {
          const minutesUntilStart = (scheduledDate.getTime() - now.getTime()) / (1000 * 60)
          
          if (minutesUntilStart <= 30 && minutesUntilStart > 0) {
            notifications.push({
              id: `session-starting-soon-${apt.id}`,
              type: "session_starting_soon",
              title: "Sessão começando em breve!",
              message: `Sua mentoria com ${counterpartName} começa em ${Math.ceil(minutesUntilStart)} minutos.`,
              timestamp: new Date().toISOString(),
              actionUrl: isMentor ? "/mentorship/mentor#upcoming" : "/mentorship/mentee#upcoming",
            })
          }
        }

        notifications.push({
          id: `booking-confirmed-${apt.id}`,
          type: "booking_confirmed",
          title: isUpcoming ? "Mentoria confirmada" : "Mentoria realizada",
          message: isUpcoming
            ? `Sua mentoria com ${counterpartName} está agendada para ${dateFormatted}.`
            : `Mentoria com ${counterpartName} realizada em ${dateFormatted}.`,
          timestamp: apt.updated_at || apt.created_at,
          actionUrl: isMentor
            ? (isUpcoming ? "/mentorship/mentor#upcoming" : "/mentorship/mentor#history")
            : (isUpcoming ? "/mentorship/mentee#upcoming" : "/mentorship/mentee#history"),
        })
      }

      if (apt.status === "cancelled") {
        const cancelledAt = new Date(apt.updated_at || apt.created_at)
        const daysSinceCancelled = (now.getTime() - cancelledAt.getTime()) / (1000 * 3600 * 24)

        if (daysSinceCancelled <= 14) {
          const reasonSnippet = apt.notes_mentor ? ` Motivo: "${apt.notes_mentor}"` : ""
          notifications.push({
            id: `booking-cancelled-${apt.id}`,
            type: "booking_cancelled",
            title: "Mentoria cancelada",
            message: `A mentoria de ${dateFormatted} com ${counterpartName} foi cancelada.${reasonSnippet}`,
            timestamp: apt.updated_at || apt.created_at,
            actionUrl: isMentor
              ? "/mentorship/mentor#history"
              : "/mentorship/mentee#history",
          })
        }
      }

      if (!isMentor && apt.status === "completed" && !reviewedAppointmentIds.has(apt.id)) {
        notifications.push({
          id: `pending-evaluation-${apt.id}`,
          type: "pending_evaluation",
          title: "Avaliação pendente",
          message: `Como foi sua sessão com ${counterpartName}? Deixe seu depoimento para apoiar o mentor.`,
          timestamp: apt.scheduled_at || apt.created_at,
          actionUrl: "/mentorship/mentee#action",
        })
      }
    }

    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ notifications })
  } catch (err) {
    console.error("[GET /api/me/notifications] Erro inesperado:", err)
    return NextResponse.json({ notifications: [] })
  }
}
