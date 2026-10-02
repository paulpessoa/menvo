"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle, Trophy } from "lucide-react"
import { Link } from "@/i18n/routing"

interface ChecklistProfile {
  first_name?: string | null
  last_name?: string | null
  slug?: string | null
  bio?: string | null
  job_title?: string | null
}

interface MenteeStats {
  completedSessions: number
}

interface MenteeActivationChecklistProps {
  profile: ChecklistProfile | null
  stats: MenteeStats
}

export function MenteeActivationChecklist({ profile, stats }: MenteeActivationChecklistProps) {
  const profileReady = Boolean(
    profile?.first_name && profile?.last_name && profile?.slug && profile?.bio && profile?.job_title
  )

  const items = [
    {
      done: profileReady,
      label: "Complete seu perfil público com suas informações",
      href: "/profile",
    },
    {
      done: stats.completedSessions > 0,
      label: "Agende e participe da sua primeira mentoria",
      href: "/mentors",
    },
    {
      done: stats.completedSessions > 0, // Simplified: assume they evaluate after a session since they are prompted
      label: "Avalie a sua primeira mentoria",
      href: "/dashboard/mentee?tab=overview",
    },
    {
      done: false,
      label: "Convide amigos para a Menvo (Em breve)",
      href: "#",
      disabled: true
    }
  ]

  return (
    <Card className="rounded-2xl border border-primary/20 bg-primary/[0.03] shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" /> Jornada do Mentorado
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Siga os passos abaixo para construir um perfil sólido e aproveitar a rede ao máximo.
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
