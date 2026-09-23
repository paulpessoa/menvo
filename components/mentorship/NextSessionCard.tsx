"use client"

import { CalendarClock, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import type { AppointmentCardData } from "@/components/appointments/appointment-card"
import { nextConfirmedSession } from "@/lib/mentorship/group-appointments"

interface NextSessionCardProps {
  upcoming: AppointmentCardData[]
  currentUserId: string
}

const pick = <T,>(v: T | T[]): T => (Array.isArray(v) ? v[0] : v)

/**
 * Compact highlight of the soonest confirmed session, with the Meet link one
 * click away. Renders nothing when there is no confirmed session — it replaces
 * the old static hero that claimed "você tem uma sessão agendada" even when
 * the user had none.
 */
export function NextSessionCard({ upcoming, currentUserId }: NextSessionCardProps) {
  const t = useTranslations("mentorship.hub")
  const next = nextConfirmedSession(upcoming)
  if (!next) return null

  const mentor = pick(next.mentor)
  const other = mentor?.id === currentUserId ? pick(next.mentee) : mentor
  const date = new Date(next.scheduled_at)
  const isToday = date.toDateString() === new Date().toDateString()

  const when = date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-primary-700 to-primary p-5 text-white shadow-md shadow-primary/20 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-white/15 p-2.5">
          <CalendarClock className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-white/80">
            {isToday ? t("nextSessionToday") : t("nextSession")}
          </p>
          <p className="text-lg font-bold first-letter:uppercase">{when}</p>
          <p className="text-sm text-white/90">{t("withPerson", { name: other?.full_name ?? "—" })}</p>
        </div>
      </div>
      {next.google_meet_link ? (
        <Button asChild className="bg-white font-bold text-primary hover:bg-white/95">
          <a href={next.google_meet_link} target="_blank" rel="noopener noreferrer">
            <Video className="mr-2 h-4 w-4" />
            {t("joinMeet")}
          </a>
        </Button>
      ) : (
        <p className="text-sm text-white/80 sm:max-w-[16rem] sm:text-right">{t("meetPending")}</p>
      )}
    </div>
  )
}
