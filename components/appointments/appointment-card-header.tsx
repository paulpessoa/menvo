"use client"

import { CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslations } from "next-intl"
import { AppointmentStatusBadge } from "./appointment-status-badge"
import type { AppointmentStatus } from "@/lib/domain/appointments/appointment-status.entity"
import type { AppointmentParty } from "./appointment-card.types"

const getInitials = (name: string) => {
  if (!name) return "??"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

interface AppointmentCardHeaderProps {
  otherPerson: AppointmentParty
  isMentor: boolean
  badgeStatus: AppointmentStatus | "expired"
  onProfileClick: () => void
}

/**
 * Top of the card: who the session is with and its (time-aware) status badge.
 * Split from the card so the profile click target stays separate from the actions.
 */
export function AppointmentCardHeader({
  otherPerson,
  isMentor,
  badgeStatus,
  onProfileClick
}: AppointmentCardHeaderProps) {
  const t = useTranslations("appointments")

  return (
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onProfileClick}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherPerson.avatar_url || undefined} />
            <AvatarFallback>{getInitials(otherPerson.full_name)}</AvatarFallback>
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
        <AppointmentStatusBadge status={badgeStatus} />
      </div>
    </CardHeader>
  )
}
