/**
 * Camada 3 · Entity (notificações do sino)
 * Regra: transforma os agendamentos e avaliações do usuário em notificações.
 * TypeScript puro: sem Supabase, React ou Next, e SEM `new Date()` interno:
 * `now` entra por parâmetro, para testar as janelas de 30 minutos e de 14 dias.
 * Não faz: buscar dados (camada 5) nem decidir quem pode ver o quê (o RLS e o
 * `userId` da sessão fazem isso).
 * Tradeoff: o `role` é uma dica que escolhe quais categorias calcular, e valores
 * que não são "mentor" nem "mentee" (ex.: "admin", que o app já envia) não geram
 * nada. Foi o comportamento da rota desde o início e o app depende dele, então
 * continua. As notificações são DERIVADAS na leitura; não há tabela delas.
 */

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

/** O que a regra precisa de um agendamento, com o nome da outra pessoa já embutido. */
export interface NotificationAppointment {
  id: string
  mentor_id: string
  mentee_id: string
  scheduled_at: string
  status: string
  notes_mentor: string | null
  created_at: string | null
  updated_at: string | null
  mentor: { full_name: string | null } | null
  mentee: { full_name: string | null } | null
}

export interface BuildNotificationsInput {
  appointments: NotificationAppointment[]
  /** Ids de agendamentos que o usuário já avaliou. */
  reviewedAppointmentIds: ReadonlySet<string>
  userId: string
  role: string | null
  now: Date
}

const SOON_MINUTES = 30
const CANCELLED_WINDOW_DAYS = 14

/** Quem pede as avaliações já feitas: o mentor nunca avalia, então não precisa buscar. */
export function needsReviewedIds(role: string | null): boolean {
  return role !== "mentor"
}

export function buildNotifications({
  appointments,
  reviewedAppointmentIds,
  userId,
  role,
  now,
}: BuildNotificationsInput): InAppNotification[] {
  const notifications: InAppNotification[] = []

  for (const apt of appointments) {
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

    const actingAsMentor = isMentor && (role === "mentor" || !role)
    const actingAsMentee = !isMentor && (role === "mentee" || !role)
    const area = isMentor ? "mentor" : "mentee"

    if (actingAsMentor && apt.status === "pending") {
      notifications.push({
        id: `booking-request-${apt.id}`,
        type: "booking_request",
        title: "Nova solicitação de mentoria",
        message: `${counterpartName} solicitou uma mentoria para ${dateFormatted}.`,
        timestamp: apt.created_at || apt.updated_at || "",
        actionUrl: "/mentorship/mentor#action",
      })
    }

    if ((actingAsMentor || actingAsMentee) && apt.status === "confirmed") {
      const isUpcoming = scheduledDate > now
      if (isUpcoming) {
        const minutesUntilStart = (scheduledDate.getTime() - now.getTime()) / (1000 * 60)
        if (minutesUntilStart <= SOON_MINUTES && minutesUntilStart > 0) {
          notifications.push({
            id: `session-starting-soon-${apt.id}`,
            type: "session_starting_soon",
            title: "Sessão começando em breve!",
            message: `Sua mentoria com ${counterpartName} começa em ${Math.ceil(minutesUntilStart)} minutos.`,
            timestamp: now.toISOString(),
            actionUrl: `/mentorship/${area}#upcoming`,
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
        timestamp: apt.updated_at || apt.created_at || "",
        actionUrl: isUpcoming ? `/mentorship/${area}#upcoming` : `/mentorship/${area}#history`,
      })
    }

    if (apt.status === "cancelled" && (actingAsMentor || actingAsMentee)) {
      const cancelledAt = new Date(apt.updated_at || apt.created_at || "")
      const daysSinceCancelled = (now.getTime() - cancelledAt.getTime()) / (1000 * 3600 * 24)

      if (daysSinceCancelled <= CANCELLED_WINDOW_DAYS) {
        const reasonSnippet = apt.notes_mentor ? ` Motivo: "${apt.notes_mentor}"` : ""
        notifications.push({
          id: `booking-cancelled-${apt.id}`,
          type: "booking_cancelled",
          title: "Mentoria cancelada",
          message: `A mentoria de ${dateFormatted} com ${counterpartName} foi cancelada.${reasonSnippet}`,
          timestamp: apt.updated_at || apt.created_at || "",
          actionUrl: `/mentorship/${area}#history`,
        })
      }
    }

    if (actingAsMentee && apt.status === "completed" && !reviewedAppointmentIds.has(apt.id)) {
      notifications.push({
        id: `pending-evaluation-${apt.id}`,
        type: "pending_evaluation",
        title: "Avaliação pendente",
        message: `Como foi sua sessão com ${counterpartName}? Deixe seu depoimento para apoiar o mentor.`,
        timestamp: apt.scheduled_at || apt.created_at || "",
        actionUrl: "/mentorship/mentee#action",
      })
    }
  }

  return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}
