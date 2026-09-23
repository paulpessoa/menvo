"use client"

import { useMemo } from "react"
import { Calendar, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { useAuth } from "@/lib/auth"
import { useMyAppointments, useInvalidateMyAppointments } from "@/hooks/useMyAppointments"
import { groupAppointments, type Perspective } from "@/lib/mentorship/group-appointments"
import { MentorshipSection } from "./MentorshipSection"
import { NextSessionCard } from "./NextSessionCard"

interface MentorshipBoardProps {
  perspective: Perspective
}

/**
 * The mentorship list for one perspective, split by what happens next:
 * "Requer sua ação" → "Próximas sessões" → "Histórico".
 *
 * Why perspective-aware: the same appointment means different work for each
 * side — a pending request is the mentor's to answer but the mentee's to wait
 * on; a finished session is the mentee's to evaluate but history for the mentor.
 */
export function MentorshipBoard({ perspective }: MentorshipBoardProps) {
  const t = useTranslations("mentorship.hub")
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useMyAppointments(perspective)
  const invalidate = useInvalidateMyAppointments()
  const userId = user?.id ?? ""

  const groups = useMemo(
    () => groupAppointments(data ?? [], perspective, userId),
    [data, perspective, userId]
  )

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">{t("loading")}</p>
      </div>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="space-y-3 py-10 text-center">
          <p className="text-muted-foreground">{t("error")}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t("retry")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const p = perspective === "mentor" ? "asMentor" : "asMentee"
  const isEmpty = !data || data.length === 0

  if (isEmpty) {
    return (
      <Card className="border-dashed">
        <CardContent className="space-y-4 py-14 text-center">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <div className="space-y-1">
            <p className="font-semibold">{t(`${p}.emptyTitle`)}</p>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">{t(`${p}.emptyDesc`)}</p>
          </div>
          <Button asChild>
            <Link href={perspective === "mentor" ? "/dashboard/mentor/availability" : "/mentors"}>
              {t(`${p}.emptyCta`)}
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <NextSessionCard upcoming={groups.upcoming} currentUserId={userId} />

      <MentorshipSection
        tone="action"
        title={t(`${p}.actionTitle`)}
        hint={t(`${p}.actionHint`)}
        appointments={groups.needsAction}
        currentUserId={userId}
        onUpdate={invalidate}
      />

      <MentorshipSection
        tone="upcoming"
        title={t("upcomingTitle")}
        hint={perspective === "mentee" ? t("asMentee.upcomingHint") : undefined}
        appointments={groups.upcoming}
        currentUserId={userId}
        onUpdate={invalidate}
        empty={<p className="text-sm text-muted-foreground">{t(`${p}.upcomingEmpty`)}</p>}
      />

      <MentorshipSection
        tone="history"
        title={t("historyTitle")}
        appointments={groups.history}
        currentUserId={userId}
        onUpdate={invalidate}
        collapseAfter={5}
      />
    </div>
  )
}
