"use client"

import { Inbox, Send } from "lucide-react"
import { useTranslations } from "next-intl"
import { useAuth } from "@/lib/auth"
import { useMyAppointments } from "@/hooks/useMyAppointments"
import { groupAppointments, type Perspective } from "@/lib/mentorship/group-appointments"
import { cn } from "@/lib/utils"

interface MentorPerspectiveSwitchProps {
  value: Perspective
  onChange: (value: Perspective) => void
}

/** Number of items in "Requer sua ação" for a perspective (0 while loading). */
function useActionCount(perspective: Perspective) {
  const { user } = useAuth()
  const { data } = useMyAppointments(perspective)
  if (!data || !user) return 0
  return groupAppointments(data, perspective, user.id).needsAction.length
}

/**
 * Two-option switch between "mentorias que recebo" (mentor) and "mentorias
 * que solicito" (mentee) — the one distinction a mentor must never confuse.
 *
 * Each side shows its own pending-action count so the mentor sees at a glance
 * whether the other side needs them, without switching.
 */
export function MentorPerspectiveSwitch({ value, onChange }: MentorPerspectiveSwitchProps) {
  const t = useTranslations("mentorship.hub")
  const counts: Record<Perspective, number> = {
    mentor: useActionCount("mentor"),
    mentee: useActionCount("mentee"),
  }

  const options: { key: Perspective; icon: typeof Inbox; label: string; sub: string }[] = [
    { key: "mentor", icon: Inbox, label: t("asMentor.tab"), sub: t("asMentor.tabSub") },
    { key: "mentee", icon: Send, label: t("asMentee.tab"), sub: t("asMentee.tabSub") },
  ]

  return (
    <div role="tablist" aria-label={t("switchLabel")} className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1.5">
      {options.map(({ key, icon: Icon, label, sub }) => {
        const active = value === key
        return (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all sm:px-4",
              active ? "bg-background shadow-sm" : "text-muted-foreground hover:bg-background/60"
            )}
          >
            <Icon className={cn("hidden h-5 w-5 shrink-0 sm:block", active && "text-primary")} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">{label}</span>
              <span className="block truncate text-xs text-muted-foreground">{sub}</span>
            </span>
            {counts[key] > 0 && (
              <span
                className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-950"
                aria-label={t("actionCount", { count: counts[key] })}
              >
                {counts[key]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
