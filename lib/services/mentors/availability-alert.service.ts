/**
 * Camada 7 · Service (alerta de disponibilidade de mentor)
 * Regra: casos de uso de registro de interesse e disparo de notificações quando
 * o mentor cadastra novos horários (C-M3).
 */
import type { AvailabilityAlert, NewAvailabilityAlert } from "@/lib/domain/mentors/availability-alert.entity"
import type { MentorAvailabilityAlertRepository } from "@/lib/repositories/mentor-availability-alert.repository"
import type { MentorAvailabilityAlertEmailData } from "@/lib/email/brevo"

export interface AvailabilityAlertServiceDeps {
  repo: MentorAvailabilityAlertRepository
  sendEmail?: (data: MentorAvailabilityAlertEmailData) => Promise<unknown>
  getMentorInfo?: (mentorId: string) => Promise<{
    full_name: string | null
    slug: string | null
    avatar_url: string | null
    job_title: string | null
    company: string | null
  } | null>
}

export type SubscribeOutcome =
  | { kind: "subscribed"; alert: AvailabilityAlert }
  | { kind: "invalid_email" }
  | { kind: "failed" }

export function createAvailabilityAlertService({
  repo,
  sendEmail,
  getMentorInfo,
}: AvailabilityAlertServiceDeps) {
  return {
    async subscribe(input: NewAvailabilityAlert): Promise<SubscribeOutcome> {
      const email = input.email.trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { kind: "invalid_email" }
      }

      try {
        const alert = await repo.subscribe({
          mentor_id: input.mentor_id,
          mentee_id: input.mentee_id ?? null,
          email,
        })
        return { kind: "subscribed", alert }
      } catch (error) {
        console.error("[availabilityAlert.subscribe]", (error as Error).message)
        return { kind: "failed" }
      }
    },

    async hasActiveAlert(mentorId: string, menteeId: string): Promise<boolean> {
      try {
        return await repo.hasActiveAlert(mentorId, menteeId)
      } catch (error) {
        console.error("[availabilityAlert.hasActiveAlert]", (error as Error).message)
        return false
      }
    },

    async notifySubscribers(mentorId: string): Promise<{ notified: number }> {
      try {
        const pending = await repo.listPendingByMentor(mentorId)
        if (pending.length === 0) return { notified: 0 }

        if (!getMentorInfo || !sendEmail) {
          console.warn("[availabilityAlert.notifySubscribers] email sender or mentor info provider not configured")
          return { notified: 0 }
        }

        const mentor = await getMentorInfo(mentorId)
        if (!mentor) {
          console.warn("[availabilityAlert.notifySubscribers] mentor not found", mentorId)
          return { notified: 0 }
        }

        const mentorName = mentor.full_name || "Mentor Menvo"
        const mentorSlug = mentor.slug || mentorId

        const notifiedIds: string[] = []

        await Promise.allSettled(
          pending.map(async (alert) => {
            try {
              await sendEmail({
                menteeEmail: alert.email,
                mentorName,
                mentorSlug,
                mentorJobTitle: mentor.job_title,
                mentorCompany: mentor.company,
                mentorAvatarUrl: mentor.avatar_url,
              })
              notifiedIds.push(alert.id)
            } catch (err) {
              console.error("[availabilityAlert.notifySubscribers] failed sending email to", alert.email, err)
            }
          })
        )

        if (notifiedIds.length > 0) {
          await repo.markNotified(notifiedIds)
        }

        return { notified: notifiedIds.length }
      } catch (error) {
        console.error("[availabilityAlert.notifySubscribers]", (error as Error).message)
        return { notified: 0 }
      }
    },
  }
}

export type AvailabilityAlertService = ReturnType<typeof createAvailabilityAlertService>
