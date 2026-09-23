"use client"

import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AppointmentCard, type AppointmentCardData } from "@/components/appointments/appointment-card"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

interface MentorshipSectionProps {
  title: string
  hint?: string
  tone: "action" | "upcoming" | "history"
  appointments: AppointmentCardData[]
  currentUserId: string
  onUpdate: () => void
  /** Rendered instead of the list when there is nothing to show. Omit to hide the section. */
  empty?: ReactNode
  /** Show only the first N cards behind a "ver mais" toggle (used for history). */
  collapseAfter?: number
}

const DOT: Record<MentorshipSectionProps["tone"], string> = {
  action: "bg-amber-400",
  upcoming: "bg-emerald-500",
  history: "bg-muted-foreground/40",
}

/**
 * One lifecycle bucket of the mentorship screen (action / upcoming / history).
 *
 * Why a section list instead of tabs: every bucket is visible at once, so the
 * user never has to click through empty tabs to find the one thing that needs
 * them — the old screen had 8 tabs, most of them empty.
 */
export function MentorshipSection({
  title,
  hint,
  tone,
  appointments,
  currentUserId,
  onUpdate,
  empty,
  collapseAfter,
}: MentorshipSectionProps) {
  const t = useTranslations("mentorship.hub")
  const [expanded, setExpanded] = useState(false)

  if (appointments.length === 0 && !empty) return null

  const visible =
    collapseAfter && !expanded ? appointments.slice(0, collapseAfter) : appointments
  const hidden = appointments.length - visible.length

  return (
    <section className="space-y-3" aria-label={title}>
      <div>
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <span className={cn("h-2 w-2 rounded-full", DOT[tone])} />
          {title}
          {appointments.length > 0 && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs normal-case tracking-normal",
                tone === "action" ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"
              )}
            >
              {appointments.length}
            </span>
          )}
        </h3>
        {hint && appointments.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
        )}
      </div>

      {appointments.length === 0 ? (
        empty
      ) : (
        <div className={cn("space-y-3", tone === "history" && "opacity-90")}>
          {visible.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              currentUserId={currentUserId}
              onAppointmentUpdate={onUpdate}
            />
          ))}
          {(hidden > 0 || expanded) && (
            <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
              {expanded ? t("showLess") : t("showMore", { count: hidden })}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
