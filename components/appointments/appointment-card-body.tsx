"use client"

import { CardContent } from "@/components/ui/card"
import { Calendar, Clock, MessageSquare, XCircle } from "lucide-react"
import { useTranslations, useFormatter } from "next-intl"
import type { Appointment, AppointmentParty } from "./appointment-card.types"

interface AppointmentCardBodyProps {
  appointment: Appointment
  currentUserId: string
  otherPerson: AppointmentParty
  dateObj: Date
  isToday: boolean
}

/**
 * Date, time, notes and (when cancelled) the cancellation box.
 * Dates are formatted with the Brasília timezone explicitly to avoid a 3h drift
 * for viewers in other zones.
 */
export function AppointmentCardBody({
  appointment,
  currentUserId,
  otherPerson,
  dateObj,
  isToday
}: AppointmentCardBodyProps) {
  const t = useTranslations("appointments")
  const format = useFormatter()

  const formattedDate = dateObj.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "numeric",
    month: "short",
    weekday: isToday ? undefined : "short"
  })

  const formattedTime = dateObj.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit"
  })

  const isCancelledAutomatically =
    !appointment.cancelled_by &&
    appointment.cancelled_at &&
    appointment.scheduled_at &&
    new Date(appointment.cancelled_at) >= new Date(appointment.scheduled_at)

  return (
    <CardContent className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <span className={isToday ? "font-bold text-primary" : ""}>
          {isToday ? t("today") : formattedDate}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium text-gray-900">{formattedTime}</span>
        <span className="text-muted-foreground">
          ({appointment.duration_minutes} {t("minutes")})
        </span>
      </div>

      {appointment.notes_mentee && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{t("menteeComments")}</span>
          </div>
          <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap break-words">
            {appointment.notes_mentee}
          </p>
        </div>
      )}

      {appointment.notes_mentor && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-gray-700">{t("mentorNotes")}</span>
          </div>
          <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap break-words">
            {appointment.notes_mentor}
          </p>
        </div>
      )}

      {appointment.status === "cancelled" && appointment.cancellation_reason && (
        <div className="space-y-1 bg-red-50 p-3 rounded-md border border-red-200">
          <div className="flex items-center gap-2 text-sm">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="font-medium text-red-900">
              {isCancelledAutomatically
                ? t("cancelledAutomatically")
                : t("cancelledBy", {
                    name:
                      appointment.cancelled_by === currentUserId
                        ? t("you")
                        : otherPerson.full_name
                  })}
            </span>
          </div>
          <p className="text-sm font-medium text-red-900 pl-6 mb-1">{t("reason")}</p>
          <p className="text-sm text-red-800 pl-6">{appointment.cancellation_reason}</p>
          {appointment.cancelled_at && (
            <p className="text-xs text-red-600 pl-6 mt-1">
              {t("cancelledAt", {
                date: format.dateTime(new Date(appointment.cancelled_at), {
                  dateStyle: "short",
                  timeStyle: "short"
                })
              })}
            </p>
          )}
        </div>
      )}
    </CardContent>
  )
}
