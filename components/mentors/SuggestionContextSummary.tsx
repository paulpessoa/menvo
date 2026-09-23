"use client"

import { useTranslations } from "next-intl"
import { SlidersHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { hasSuggestionContext, type SuggestionContext } from "@/lib/schemas/suggestions"

interface SuggestionContextSummaryProps {
  context?: SuggestionContext | null
}

/**
 * Read-only chips of the filters that go along with a suggestion. Showing them
 * tells the person they don't need to retype what they already filtered by.
 */
export function SuggestionContextSummary({ context }: SuggestionContextSummaryProps) {
  const t = useTranslations("mentorsPage.suggestModal")
  if (!hasSuggestionContext(context)) return null

  const location = [context.city, context.state, context.country].filter(Boolean).join(", ")
  const labels = [
    ...(context.topics ?? []),
    ...(context.languages ?? []),
    ...(context.inclusiveTags ?? []),
    location,
    context.availabilityStatus ? t(`availability.${context.availabilityStatus}`) : "",
    context.experienceYears ? t("experienceYears", { value: context.experienceYears }) : "",
  ].filter(Boolean)

  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
        {t("contextLabel")}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {labels.map((label) => (
          <Badge
            key={label}
            variant="secondary"
            className="rounded-lg px-2 py-0.5 text-xs font-medium bg-background border border-border"
          >
            {label}
          </Badge>
        ))}
      </div>
    </div>
  )
}
