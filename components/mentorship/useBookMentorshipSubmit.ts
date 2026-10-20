"use client"

import { useState } from "react"
import { useLocale } from "next-intl"
import { ApiClientError } from "@/lib/query/http"
import { useRequestAppointment } from "@/hooks/appointments/useRequestAppointment"
import { trackBookingConfirmed } from "@/lib/utils/google-analytics/events"
import type { TimeSlot } from "./book-mentorship-slots"

interface UseBookMentorshipSubmitArgs {
  mentorId: string
  selectedSlot: TimeSlot | null
  message: string
  onClose: () => void
  /** The mentee still owes a check-in: restart the flow so the prompt shows. */
  onPendingCheckin: () => void
  /** Someone else took the slot: reload the list and go back to step 1. */
  onSlotTaken: () => void
  onReset: () => void
}

/**
 * Submit side of the booking modal: builds the request from the chosen slot,
 * maps the route's errors (409 pending check-in / slot taken) to messages and
 * runs the success redirect.
 *
 * Why a hook: keeps the modal under the size budget and the error mapping in one
 * place. The payload still sends both snake_case and camelCase keys because the
 * schedule route reads either.
 */
export function useBookMentorshipSubmit({
  mentorId,
  selectedSlot,
  message,
  onClose,
  onPendingCheckin,
  onSlotTaken,
  onReset
}: UseBookMentorshipSubmitArgs) {
  const locale = useLocale()
  const schedule = useRequestAppointment().schedule
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const submit = async () => {
    if (!selectedSlot) return
    setError("")

    try {
      const year = selectedSlot.date.getFullYear()
      const month = String(selectedSlot.date.getMonth() + 1).padStart(2, "0")
      const day = String(selectedSlot.date.getDate()).padStart(2, "0")
      const requestedDate = `${year}-${month}-${day}`
      const requestedStartTime = selectedSlot.start_time
      const requestedEndTime = selectedSlot.end_time
      const scheduledAt = new Date(
        `${requestedDate}T${requestedStartTime.length === 5 ? requestedStartTime + ":00" : requestedStartTime}-03:00`
      ).toISOString()

      const payload = {
        mentorId,
        mentor_id: mentorId,
        scheduledAt,
        scheduled_at: scheduledAt,
        requestedDate,
        requested_date: requestedDate,
        requestedStartTime,
        requested_start_time: requestedStartTime,
        requestedEndTime,
        requested_end_time: requestedEndTime,
        durationMinutes: 45,
        duration_minutes: 45,
        message: message.trim()
      }

      try {
        await schedule.mutateAsync(payload)
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 409) {
          const details = err.body?.details as { reason?: string } | undefined
          if (details?.reason === "pending_checkin") {
            onPendingCheckin()
            return
          }
          throw new Error(
            (typeof err.body?.message === "string" && err.body.message) ||
              "Este horário acabou de ser agendado por outro participante. Por favor, escolha outro horário."
          )
        }
        if (err instanceof ApiClientError) {
          const { error, message } = err.body ?? {}
          throw new Error(
            (typeof error === "string" && error) ||
              (typeof message === "string" && message) ||
              "Erro ao agendar mentoria"
          )
        }
        throw err
      }

      trackBookingConfirmed({
        mentorId,
        requestedDate,
        requestedTime: requestedStartTime,
        isFirstBooking: true
      })

      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
        onReset()
        window.location.href = `/${locale}/mentorship/mentee#upcoming`
      }, 1500)
    } catch (err) {
      const text = err instanceof Error ? err.message : ""
      setError(text || "Falha ao confirmar o agendamento.")
      if (text.includes("acabou de ser agendado")) onSlotTaken()
    }
  }

  return { submit, isSubmitting: schedule.isPending, error, success, clearError: () => setError("") }
}
