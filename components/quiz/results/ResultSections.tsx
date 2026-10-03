"use client"

import { Check, RotateCcw, Sparkles } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { ResultSection } from "./ResultSection"

/** The numbered plan: the core of the result, shown first. */
export function ActionPlan({ steps }: { steps: string[] }) {
  const t = useTranslations("quiz")
  return (
    <ResultSection title={t("quiz_results.action_plan")}>
      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li key={index} className="flex break-inside-avoid gap-4 rounded-2xl border bg-card p-5">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
              {index + 1}
            </span>
            <p className="pt-1 leading-relaxed">{step}</p>
          </li>
        ))}
      </ol>
    </ResultSection>
  )
}

export function PracticalAdvice({ tips }: { tips: string[] }) {
  const t = useTranslations("quiz")
  return (
    <ResultSection title={t("quiz_results.practical_advice")}>
      <ul className="space-y-3 rounded-2xl bg-accent p-6">
        {tips.map((tip, index) => (
          <li key={index} className="flex break-inside-avoid items-start gap-3">
            <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
            <span className="leading-relaxed">{tip}</span>
          </li>
        ))}
      </ul>
    </ResultSection>
  )
}

export function DevelopmentAreas({ areas }: { areas: string[] }) {
  const t = useTranslations("quiz")
  return (
    <ResultSection title={t("quiz_results.development_areas")}>
      <div className="flex flex-wrap gap-2">
        {areas.map((area, index) => (
          <span key={index} className="rounded-full border border-primary/30 px-3 py-1.5 text-sm font-medium text-foreground">
            {area}
          </span>
        ))}
      </div>
    </ResultSection>
  )
}

export function FinalMessage({ message }: { message: string }) {
  return (
    <blockquote className="break-inside-avoid border-l-4 border-primary pl-5 text-lg font-medium leading-relaxed text-foreground">
      {message}
    </blockquote>
  )
}

/** Invitation shown when the analysis flags the person as a potential mentor. */
export function PotentialMentorCta() {
  const t = useTranslations("quiz")
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between print:hidden">
      <div>
        <p className="text-lg font-bold">{t("quiz_results.final_message_potential_mentor")}</p>
        <p className="mt-1 text-sm opacity-90">{t("quiz_results.final_message_potential_mentor_description")}</p>
      </div>
      <Button asChild variant="secondary" className="shrink-0 rounded-xl">
        <Link href="/signup">{t("quiz_results.become_mentor")}</Link>
      </Button>
    </div>
  )
}

/** AI disclaimer, generation date and the retake link. */
export function ResultFooter({ processedAt }: { processedAt: string | null }) {
  const t = useTranslations("quiz")
  const locale = useLocale()
  const generatedOn = processedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(processedAt))
    : null

  return (
    <footer className="mt-14 border-t pt-6 text-xs leading-relaxed text-muted-foreground">
      <p className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        <span>
          {t("quiz_results.ai_disclaimer")}
          {generatedOn && <> · {t("quiz_results.generated_on", { date: generatedOn })}</>}
        </span>
      </p>
      <Link
        href="/quiz"
        className="mt-3 inline-flex items-center gap-1.5 font-medium hover:text-primary print:hidden"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {t("quiz_results.retake_link")}
      </Link>
    </footer>
  )
}
