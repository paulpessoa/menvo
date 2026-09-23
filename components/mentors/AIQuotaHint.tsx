"use client"

import { useLocale, useTranslations } from "next-intl"
import type { AiQuotaStatus } from "@/lib/ai/quota"

/**
 * Shows the remaining monthly AI searches before the user clicks, so hitting
 * the limit is never a surprise. Hidden for unlimited users (admins).
 */
export function AIQuotaHint({ quota }: { quota: AiQuotaStatus | undefined }) {
  const t = useTranslations("mentorsPage.magicSearch")
  const locale = useLocale()

  if (!quota || quota.limit === null || quota.remaining === null) return null

  const date = new Date(quota.resetsAt).toLocaleDateString(locale, { day: "2-digit", month: "2-digit" })
  const message =
    quota.reason === "budget"
      ? t("budgetExhausted", { date })
      : quota.remaining > 0
        ? t("quotaRemaining", { remaining: quota.remaining, limit: quota.limit })
        : t("quotaExhausted", { date })

  return (
    <p className="text-xs text-muted-foreground" aria-live="polite">
      {message}
    </p>
  )
}
