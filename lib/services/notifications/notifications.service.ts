import type {
  InAppNotification as ServerNotification,
  NotificationType,
} from "@/lib/domain/profile/notification.entity"

export type { NotificationType }

/** A notificação que a rota devolve, mais o estado de leitura que só existe no navegador. */
export interface InAppNotification extends ServerNotification {
  isRead?: boolean
}

/**
 * Client-side wrapper around GET /api/me/notifications. Used to derive
 * notifications from `appointments`/`appointment_feedbacks` straight from
 * the browser with a client-supplied userId
 * (docs/COMMUNITY_CONTACT_PLAN.md §13); kept as a thin fetch layer, same
 * method name, so `hooks/useNotifications.ts` didn't need to change.
 * `userId` is accepted but unused - the server derives it from the session.
 */
class NotificationsService {
  async getUserNotifications(_userId: string, role?: string | null): Promise<InAppNotification[]> {
    try {
      const qs = role ? `?role=${encodeURIComponent(role)}` : ""
      const res = await fetch(`/api/me/notifications${qs}`)
      if (!res.ok) return []
      const { notifications } = await res.json()
      return notifications || []
    } catch (err) {
      console.error("[notificationsService] Erro ao buscar notificações:", err)
      return []
    }
  }
}

export const notificationsService = new NotificationsService()
