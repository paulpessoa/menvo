"use client"

import { Card } from "@/components/ui/card"
import { CompleteAppointmentModal } from "./complete-appointment-modal"
import { NoShowModal } from "./no-show-modal"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/routing"
import { useFeatureFlag } from "@/lib/feature-flags"
import { toast } from "sonner"
import { useCompleteAppointment } from "@/hooks/appointments/useCompleteAppointment"
import type { Appointment } from "./appointment-card.types"
import { deriveAppointmentCardState } from "./appointment-card-state"
import { AppointmentCardHeader } from "./appointment-card-header"
import { AppointmentCardBody } from "./appointment-card-body"
import { AppointmentCardActions } from "./appointment-card-actions"

/** Shape returned by `/api/appointments/list`, as consumed by the card. */
export type AppointmentCardData = Appointment

interface AppointmentCardProps {
  appointment: Appointment
  currentUserId: string
  onAppointmentUpdate?: (appointment: Appointment) => void
}

/**
 * One session in a list. Orchestrates the mutations and modals; what to show is
 * derived in `appointment-card-state` and drawn by the header/body/actions parts.
 */
export function AppointmentCard({
  appointment,
  currentUserId,
  onAppointmentUpdate
}: AppointmentCardProps) {
  const t = useTranslations("appointments")
  const router = useRouter()
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [isNoShowModalOpen, setIsNoShowModalOpen] = useState(false)
  const complete = useCompleteAppointment()
  const isChatEnabled = useFeatureFlag("chat_flag")
  const state = deriveAppointmentCardState(appointment, currentUserId, isChatEnabled)
  const { otherPerson, isMentor } = state

  const handleMentorComplete = async () => {
    try {
      await complete.mutateAsync({ appointmentId: appointment.id })
      toast.success(t("sessionCompletedSuccess"))
      onAppointmentUpdate?.({ ...appointment, status: "completed" })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao concluir a sessão.")
    }
  }

  const handleNoShowSuccess = (notes?: string) => {
    const trimmedNotes = notes?.trim()
    const reason = trimmedNotes
      ? `Mentorado não compareceu: ${trimmedNotes}`
      : "Mentorado não compareceu à sessão"
    onAppointmentUpdate?.({
      ...appointment,
      status: "cancelled",
      cancellation_reason: reason,
      notes_mentor: trimmedNotes || "Mentorado não compareceu à sessão.",
      cancelled_by: currentUserId,
      cancelled_at: new Date().toISOString()
    })
  }

  const handleProfileClick = () => {
    if (!isMentor && otherPerson.id) {
      router.push(`/mentors/${otherPerson.slug || otherPerson.id}`)
    }
  }

  return (
    <Card className="w-full">
      <AppointmentCardHeader
        otherPerson={otherPerson}
        isMentor={isMentor}
        badgeStatus={state.badgeStatus}
        onProfileClick={handleProfileClick}
      />
      <AppointmentCardBody
        appointment={appointment}
        currentUserId={currentUserId}
        otherPerson={otherPerson}
        dateObj={state.dateObj}
        isToday={state.isToday}
      />

      {state.hasActions && (
        <AppointmentCardActions
          appointment={appointment}
          currentUserId={currentUserId}
          state={state}
          isCompleting={complete.isPending}
          onMentorComplete={handleMentorComplete}
          onOpenComplete={() => setIsCompleteModalOpen(true)}
          onOpenNoShow={() => setIsNoShowModalOpen(true)}
          onChanged={() => onAppointmentUpdate?.(appointment)}
        />
      )}

      <CompleteAppointmentModal
        open={isCompleteModalOpen}
        onOpenChange={setIsCompleteModalOpen}
        appointment={appointment}
        currentUserId={currentUserId}
        isMentor={isMentor}
        onCompleted={() => onAppointmentUpdate?.(appointment)}
      />

      <NoShowModal
        open={isNoShowModalOpen}
        onOpenChange={setIsNoShowModalOpen}
        appointmentId={appointment.id}
        menteeName={otherPerson.full_name}
        onSuccess={handleNoShowSuccess}
      />
    </Card>
  )
}
