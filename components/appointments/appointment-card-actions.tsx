"use client"

import { CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, ExternalLink, CheckCircle2, Linkedin, UserX } from "lucide-react"
import { useTranslations } from "next-intl"
import { ConfirmAppointmentButton } from "./confirm-appointment-button"
import { CancelAppointmentButton } from "./cancel-appointment-button"
import { ChatButton } from "./chat-button"
import type { Appointment } from "./appointment-card.types"
import type { AppointmentCardState } from "./appointment-card-state"

interface AppointmentCardActionsProps {
  appointment: Appointment
  currentUserId: string
  state: AppointmentCardState
  isCompleting: boolean
  onMentorComplete: () => void
  onOpenComplete: () => void
  onOpenNoShow: () => void
  onChanged: () => void
}

/**
 * Footer with every action the viewer may take on this session (chat/LinkedIn on
 * the left, state changes on the right). Which ones show is decided by `state`,
 * so this component holds no business rules.
 */
export function AppointmentCardActions({
  appointment,
  currentUserId,
  state,
  isCompleting,
  onMentorComplete,
  onOpenComplete,
  onOpenNoShow,
  onChanged
}: AppointmentCardActionsProps) {
  const t = useTranslations("appointments")
  const { isMentor, otherPerson } = state

  return (
    <CardFooter className="pt-3 flex-col sm:flex-row gap-3">
      <div className="flex gap-2 flex-wrap">
        {state.showChat && (
          <ChatButton
            appointment={appointment}
            currentUserId={currentUserId}
            isMentor={isMentor}
          />
        )}
        {/* Chat desligado: a conversa acontece no LinkedIn da outra pessoa */}
        {state.showLinkedin && (
          <Button variant="outline" size="sm" asChild>
            <a href={otherPerson.linkedin_url ?? undefined} target="_blank" rel="noopener noreferrer">
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </a>
          </Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap sm:ml-auto">
        {state.canMentorComplete && (
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white font-medium"
            onClick={onMentorComplete}
            disabled={isCompleting}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {t("markAsCompleted")}
          </Button>
        )}

        {state.canReportNoShow && (
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-medium"
            onClick={onOpenNoShow}
          >
            <UserX className="h-4 w-4 mr-2" />
            {t("markNoShow")}
          </Button>
        )}

        {state.canComplete && (
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white font-medium"
            onClick={onOpenComplete}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {t("evaluate")}
          </Button>
        )}

        {state.canConfirm && (
          <ConfirmAppointmentButton appointment={appointment} onConfirmed={onChanged} />
        )}

        {state.canCancel && (
          <CancelAppointmentButton
            appointment={appointment}
            onCancelled={onChanged}
            variant="outline"
          />
        )}
        {state.canJoinMeet && (
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-medium" asChild>
            <a href={appointment.google_meet_link} target="_blank" rel="noopener noreferrer">
              <Video className="w-4 h-4 mr-2" />
              {t("joinMeet")}
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        )}
      </div>
    </CardFooter>
  )
}
