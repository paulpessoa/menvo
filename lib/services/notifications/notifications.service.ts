import { createClient } from "@/lib/utils/supabase/client"

export type NotificationType =
  | "booking_request"
  | "booking_confirmed"
  | "booking_cancelled"
  | "pending_evaluation"

export interface InAppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  actionUrl: string
  isRead?: boolean
}

/**
 * Service for consolidating in-app notifications for users.
 */
class NotificationsService {
  private get supabase() {
    return createClient()
  }

  /**
   * Retrieves active in-app notifications for a user based on their mentorship appointments and reviews.
   */
  async getUserNotifications(userId: string, role?: string | null): Promise<InAppNotification[]> {
    if (!userId) return []

    try {
      // 1. Buscar agendamentos recentes do usuário
      const { data: appointments, error } = await (this.supabase
        .from("appointments") as any)
        .select(`
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
        `)
        .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)
        .order("updated_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("[notificationsService] Erro ao buscar agendamentos:", error)
        return []
      }

      const rawList = (appointments as any[]) || []
      const notifications: InAppNotification[] = []

      // 2. Buscar avaliações já feitas para detectar pendências (apenas para mentorados)
      let reviewedAppointmentIds = new Set<string | number>()
      if (role !== "mentor") {
        const { data: feedbacks } = await (this.supabase
          .from("appointment_feedbacks") as any)
          .select("appointment_id")
          .eq("reviewer_id", userId)

        reviewedAppointmentIds = new Set(
          (feedbacks || []).map((f: any) => f.appointment_id)
        )
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
          minute: "2-digit"
        })

        // A) Nova solicitação de mentoria (exclusivo para o mentor quando status === 'pending')
        if (isMentor && apt.status === "pending") {
          notifications.push({
            id: `booking-request-${apt.id}`,
            type: "booking_request",
            title: "Nova solicitação de mentoria",
            message: `${counterpartName} solicitou uma mentoria para ${dateFormatted}.`,
            timestamp: apt.created_at || apt.updated_at,
            actionUrl: "/dashboard/mentor"
          })
        }

        // B) Mentoria confirmada
        if (apt.status === "confirmed") {
          const isUpcoming = scheduledDate > now
          notifications.push({
            id: `booking-confirmed-${apt.id}`,
            type: "booking_confirmed",
            title: isUpcoming ? "Mentoria confirmada" : "Mentoria realizada",
            message: isUpcoming
              ? `Sua mentoria com ${counterpartName} está agendada para ${dateFormatted}.`
              : `Mentoria com ${counterpartName} realizada em ${dateFormatted}.`,
            timestamp: apt.updated_at || apt.created_at,
            actionUrl: isMentor ? "/dashboard/mentor" : "/dashboard/mentee"
          })
        }

        // C) Mentoria cancelada (recente nos últimos 14 dias)
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
              actionUrl: isMentor ? "/dashboard/mentor" : "/dashboard/mentee"
            })
          }
        }

        // D) Avaliação pendente pós-mentoria (exclusivo para o mentee em sessões concluídas)
        if (!isMentor && apt.status === "completed" && !reviewedAppointmentIds.has(apt.id)) {
          notifications.push({
            id: `pending-evaluation-${apt.id}`,
            type: "pending_evaluation",
            title: "Avaliação pendente",
            message: `Como foi sua sessão com ${counterpartName}? Deixe seu depoimento para apoiar o mentor.`,
            timestamp: apt.scheduled_at || apt.created_at,
            actionUrl: "/dashboard/mentee"
          })
        }
      }

      // Ordenar por data mais recente primeiro
      notifications.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      return notifications
    } catch (err) {
      console.error("[notificationsService] Erro inesperado ao gerar notificações:", err)
      return []
    }
  }
}

export const notificationsService = new NotificationsService()
