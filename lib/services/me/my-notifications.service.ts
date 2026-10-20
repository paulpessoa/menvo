/**
 * Camada 7 · Service (notificações do sino)
 * Regra: busca as fontes e entrega à regra pura da entity. Nunca falha para o
 * chamador: erro de banco vira lista vazia, porque o sino do app não pode
 * quebrar uma tela (comportamento original da rota, que o app assume).
 * Não faz: HTTP nem autenticação (camada 8).
 * Tradeoff: esconder a falha como "sem notificações" é uma mentira útil; por
 * isso cada falha é registrada com o nome da etapa, e não some em silêncio.
 * Falha na lista de avaliações só tira a notificação de "avaliação pendente"
 * de quem já avaliou (aparece de novo), não derruba as outras.
 */
import {
  buildNotifications,
  needsReviewedIds,
  type InAppNotification,
} from "@/lib/domain/profile/notification.entity"
import type { MeNotificationsRepository } from "@/lib/repositories/me-notifications.repository"

export interface MyNotificationsServiceDeps {
  repo: MeNotificationsRepository
  /** Injetável para teste. */
  now?: () => Date
}

export function createMyNotificationsService({ repo, now = () => new Date() }: MyNotificationsServiceDeps) {
  return {
    async list(userId: string, role: string | null): Promise<InAppNotification[]> {
      try {
        const appointments = await repo.listRecentAppointments(userId)

        let reviewed: string[] = []
        if (needsReviewedIds(role)) {
          try {
            reviewed = await repo.listReviewedAppointmentIds(userId)
          } catch (error) {
            console.error("[myNotifications.reviewed]", (error as Error).message)
          }
        }

        return buildNotifications({
          appointments,
          reviewedAppointmentIds: new Set(reviewed),
          userId,
          role,
          now: now(),
        })
      } catch (error) {
        console.error("[myNotifications.list]", (error as Error).message)
        return []
      }
    },
  }
}

export type MyNotificationsService = ReturnType<typeof createMyNotificationsService>
