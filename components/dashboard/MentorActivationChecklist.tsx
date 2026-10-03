"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle, Trophy } from "lucide-react"
import { Link } from "@/i18n/routing"

interface ChecklistProfile {
  is_public?: boolean | null
  expertise_areas?: string[] | null
  mentorship_topics?: string[] | null
}

interface MentorStats {
  completedSessions: number
  totalReviews: number
}

interface MentorActivationChecklistProps {
  profile: ChecklistProfile | null
  stats: MentorStats
}

export function MentorActivationChecklist({ profile, stats }: MentorActivationChecklistProps) {
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

  if (availabilityConfigured === null) return null

  const items = [
    {
      done: availabilityConfigured,
      label: "Configure sua disponibilidade semanal",
      href: "/dashboard/mentor/availability",
    },
    {
      done: profileReady,
      label: "Deixe seu perfil público e adicione seus temas",
      href: "/profile",
    },
    {
      done: stats.completedSessions > 0,
      label: "Dê a sua primeira mentoria",
      href: "/dashboard/mentor/availability",
    },
    {
      done: stats.totalReviews > 0,
      label: "Receba sua primeira avaliação",
      href: "/dashboard/mentor",
    },
    {
      done: false,
      label: "Convide amigos para a Menvo (Em breve)",
      href: "#",
      disabled: true
    }
  ]

  return (
    <Card id="tour-mentor-checklist" className="rounded-2xl border border-primary/20 bg-primary/[0.03] shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" /> Jornada do Mentor
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Complete os passos abaixo para ter um perfil campeão e aumentar suas chances de realizar mentorias.
        </p>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {items.map((item, idx) => {
          const isSoon = item.disabled
          return (
            <Link
              key={idx}
              href={item.disabled ? "#" : item.href}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-colors ${item.done ? "" : isSoon ? "opacity-60 cursor-default" : "hover:bg-primary/5"}`}
              onClick={(e) => isSoon && e.preventDefault()}
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
          )
        })}
      </CardContent>
    </Card>
  )
}
