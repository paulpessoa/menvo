"use client"

import { ArrowRight, Send } from "lucide-react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import type { SuggestedMentor } from "@/lib/domain/quiz/quiz.entity"
import type { MentorSlugMaps } from "@/hooks/quiz/useMentorSlugs"
import { ResultSection } from "./ResultSection"

interface SuggestedMentorsProps {
  mentors: SuggestedMentor[]
  slugs: MentorSlugMaps
  /** Only the person who took the quiz can share it with a mentor. */
  canShare: boolean
  onShare: () => void
}

/**
 * Mentor cards from the analysis. A suggestion links to the real profile when
 * the name resolved; otherwise to a search by that name, never to a dead link.
 */
export function SuggestedMentors({ mentors, slugs, canShare, onShare }: SuggestedMentorsProps) {
  const t = useTranslations("quiz")

  return (
    <ResultSection
      title={t("quiz_results.suggested_mentors")}
      action={
        canShare ? (
          <Button size="sm" className="gap-2 rounded-xl print:hidden" onClick={onShare}>
            <Send className="h-4 w-4" />
            {t("quiz_results.share_with_mentor")}
          </Button>
        ) : undefined
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mentors.map((mentor, index) => {
          const name = mentor.mentor_nome?.trim()
          const slug = name ? slugs.slugByName[name.toLowerCase()] : null
          const href = slug ? `/mentors/${slug}` : name ? `/mentors?search=${encodeURIComponent(name)}` : "/mentors"

          return (
            <Link
              key={index}
              href={href}
              className="group flex break-inside-avoid flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-primary/60"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{mentor.tipo}</p>
              {name && (
                <p className="mt-2 flex items-center gap-2 text-lg font-bold">
                  {name}
                  {mentor.disponivel && (
                    <span
                      className="h-2 w-2 rounded-full bg-green-500"
                      title={t("quiz_results.available")}
                      aria-label={t("quiz_results.available")}
                    />
                  )}
                </p>
              )}
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{mentor.razao}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary print:hidden">
                {name ? t("quiz_results.view_profile") : t("quiz_results.find_mentors")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          )
        })}
      </div>
      <Link
        href="/mentors"
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary print:hidden"
      >
        {t("quiz_results.all_mentors")}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </ResultSection>
  )
}
