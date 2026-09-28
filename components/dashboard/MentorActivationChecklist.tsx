"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle, UserCheck } from "lucide-react"
import { Link } from "@/i18n/routing"

interface ChecklistProfile {
  is_public?: boolean | null
  expertise_areas?: string[] | null
  mentorship_topics?: string[] | null
}

interface MentorActivationChecklistProps {
  profile: ChecklistProfile | null
}

/**
 * Shown on `/dashboard/mentor` right after approval, until the mentor has
 * done everything needed to actually be bookable. A mentor with the `mentor`
 * role but no availability or no topics filled in is invisible/un-bookable
 * on `/mentors` (see docs/domains/mentor-verification.md) and nothing today
 * tells them why — this card is that missing signal.
 *
 * No "connect Google Calendar" item on purpose: Meet links are created on a
 * single platform account (GOOGLE_CALENDAR_REFRESH_TOKEN) with the mentor as
 * attendee, so mentors never connect their own calendar — see
 * docs/product/how-it-works.md, C-T1b.
 */
export function MentorActivationChecklist({ profile }: MentorActivationChecklistProps) {
  const [availabilityConfigured, setAvailabilityConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/mentors/availability")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((res) => {
        if (!cancelled) setAvailabilityConfigured((res.data || []).length > 0)
      })
      .catch(() => {
        if (!cancelled) setAvailabilityConfigured(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const profileReady = Boolean(
    profile?.is_public &&
      (((profile.expertise_areas?.length ?? 0) > 0) || ((profile.mentorship_topics?.length ?? 0) > 0))
  )

  // Still loading availability — don't flash a wrong state.
  if (availabilityConfigured === null) return null

  const items = [
    {
      done: availabilityConfigured,
      label: "Configure sua disponibilidade semanal",
      href: "/dashboard/mentor/availability"
    },
    {
      done: profileReady,
      label: "Deixe seu perfil público com os temas que você mentora",
      href: "/profile"
    }
  ]

  if (items.every((item) => item.done)) return null

  return (
    <Card className="rounded-2xl border border-primary/20 bg-primary/[0.03] shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-primary" /> Complete sua ativação
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Falta isso para você aparecer no catálogo de mentores e começar a receber pedidos de sessão.
        </p>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-colors ${item.done ? "" : "hover:bg-primary/5"}`}
          >
            {item.done ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className={`text-xs font-medium ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
