"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  Video,
  MessageSquare,
  ExternalLink,
  XCircle,
  CheckCircle2
} from "lucide-react"
import { AppointmentStatusBadge } from "./appointment-status-badge"
import { ConfirmAppointmentButton } from "./confirm-appointment-button"
import { CancelAppointmentButton } from "./cancel-appointment-button"
import { ChatButton } from "./chat-button"
import { CompleteAppointmentModal } from "./complete-appointment-modal"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/utils/supabase/client"
import { useTranslations, useFormatter } from "next-intl"

interface Appointment {
  id: string | number
  scheduled_at: string
  duration_minutes: number
  status: "pending" | "confirmed" | "cancelled" | "completed"
  notes_mentee?: string
  notes_mentor?: string
  google_meet_link?: string
  cancellation_reason?: string
  cancelled_at?: string
  cancelled_by?: string
  mentor: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  mentee: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
}

interface AppointmentCardProps {
  appointment: Appointment
  currentUserId: string
  onAppointmentUpdate?: (appointment: Appointment) => void
}

export function AppointmentCard({
  appointment,
  currentUserId,
  onAppointmentUpdate
}: AppointmentCardProps) {
  const t = useTranslations("appointments")
  const commonT = useTranslations("common")
  const format = useFormatter()
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [hasUserEvaluated, setHasUserEvaluated] = useState(false)
  const [loading, setLoading] = useState(true)

  const mentor = Array.isArray(appointment.mentor)
    ? appointment.mentor[0]
    : appointment.mentor
  const mentee = Array.isArray(appointment.mentee)
    ? appointment.mentee[0]
    : appointment.mentee

  const isMentor = mentor?.id === currentUserId
  const otherPerson = (isMentor ? mentee : mentor) || { id: "", full_name: "Usuário", avatar_url: null }
  const userRole = isMentor ? "mentor" : "mentee"

  useEffect(() => {
    const checkEvaluation = async () => {
      if (isMentor || appointment.status !== "confirmed") {
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data } = await supabase
        .from("appointment_feedbacks")
        .select("id")
        .eq("appointment_id", Number(appointment.id))
        .eq("reviewer_id", currentUserId)
        .maybeSingle()

      setHasUserEvaluated(!!data)
      setLoading(false)
    }

    checkEvaluation()
  }, [appointment.id, appointment.status, currentUserId, isMentor])

  const dateObj = new Date(appointment.scheduled_at)
  const now = new Date()
  const isToday = dateObj.toDateString() === now.toDateString()
  const endTime = new Date(
    dateObj.getTime() + appointment.duration_minutes * 60 * 1000
  )
  const isPast = endTime < now

  const formattedDate = format.dateTime(dateObj, {
    weekday: isToday ? undefined : "short",
    day: "numeric",
    month: "short",
    year: dateObj.getFullYear() !== now.getFullYear() ? "numeric" : undefined
  })

  const formattedTime = format.dateTime(dateObj, {
    hour: "2-digit",
    minute: "2-digit"
  })

  const getInitials = (name: string) => {
    if (!name) return "??"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const canConfirm = isMentor && appointment.status === "pending"
  const canCancel =
    (appointment.status === "pending" || appointment.status === "confirmed") &&
    !isPast
  const canJoinMeet =
    appointment.status === "confirmed" &&
    appointment.google_meet_link &&
    !isPast
  const canChat =
    appointment.status === "pending" || appointment.status === "confirmed"
  const canComplete =
    !isMentor &&
    appointment.status === "confirmed" &&
    isPast &&
    !hasUserEvaluated &&
    !loading

  const handleProfileClick = async () => {
    const rolePath = isMentor ? "mentee" : "mentors"
    try {
      const response = await fetch(`/api/${rolePath}/${otherPerson.id}`)
      if (response.ok) {
        const data = await response.json()
        const slug = data.slug || otherPerson.id
        window.location.href = `/${rolePath}/${slug}`
      } else {
        window.location.href = `/${rolePath}/${otherPerson.id}`
      }
    } catch (error) {
      window.location.href = `/${rolePath}/${otherPerson.id}`
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleProfileClick}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherPerson.avatar_url || undefined} />
              <AvatarFallback>
                {getInitials(otherPerson.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm hover:text-primary transition-colors">
                {otherPerson.full_name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isMentor
                  ? t("roleMentee", { defaultValue: "Mentee" })
                  : t("roleMentor", { defaultValue: "Mentor" })}
              </p>
            </div>
          </div>
          <AppointmentStatusBadge status={appointment.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className={isToday ? "font-medium text-blue-600" : ""}>
            {isToday ? t("today") : formattedDate}
          </span>
          {isToday && (
            <Badge variant="outline" className="text-xs">
              {t("today")}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{formattedTime}</span>
          <span className="text-muted-foreground">
            ({appointment.duration_minutes} {t("minutes")})
          </span>
          {isPast && appointment.status !== "completed" && (
            <Badge variant="outline" className="text-xs text-orange-600">
              {t("expired")}
            </Badge>
          )}
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
              <span className="font-semibold text-gray-700">
                {t("mentorNotes")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap break-words">
              {appointment.notes_mentor}
            </p>
          </div>
        )}

        {appointment.status === "cancelled" &&
          appointment.cancellation_reason && (
            <div className="space-y-1 bg-red-50 p-3 rounded-md border border-red-200">
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="font-medium text-red-900">
                  {t("cancelledBy", {
                    name:
                      appointment.cancelled_by === currentUserId
                        ? t("you")
                        : otherPerson.full_name
                  })}
                </span>
              </div>
              <p className="text-sm font-medium text-red-900 pl-6 mb-1">
                {t("reason")}
              </p>
              <p className="text-sm text-red-800 pl-6">
                {appointment.cancellation_reason}
              </p>
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

      <CardFooter className="pt-3 flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {(canChat || canConfirm) && (
            <ChatButton
              appointment={appointment as any}
              currentUserId={currentUserId}
              isMentor={isMentor}
            />
          )}
        </div>

        <div className="flex gap-2 flex-wrap sm:ml-auto">
          {canComplete && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setIsCompleteModalOpen(true)}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {t("evaluate")}
            </Button>
          )}

          {canConfirm && (
            <ConfirmAppointmentButton
              appointment={appointment as any}
              onConfirmed={() => onAppointmentUpdate?.(appointment)}
            />
          )}

          {canCancel && (
            <CancelAppointmentButton
              appointment={appointment as any}
              onCancelled={() => onAppointmentUpdate?.(appointment)}
              variant="outline"
            />
          )}
          {canJoinMeet && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              asChild
            >
              <a
                href={appointment.google_meet_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Video className="w-4 h-4 mr-2" />
                {t("joinMeet")}
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
          )}
        </div>
      </CardFooter>

      <CompleteAppointmentModal
        open={isCompleteModalOpen}
        onOpenChange={setIsCompleteModalOpen}
        appointment={appointment as any}
        currentUserId={currentUserId}
        isMentor={isMentor}
        onCompleted={() => {
          onAppointmentUpdate?.(appointment)
        }}
      />
    </Card>
  )
}
