"use client"

import { useAuth } from "@/lib/auth"
import { useFeatureFlag } from "@/lib/feature-flags"

/**
 * Where "take the diagnostic" links should go. The chat (`/assistant`) needs
 * login and `ai_assistant_flag`; anyone who can't use it falls back to the
 * anonymous `/quiz`, so the CTA never lands on a login wall or "em breve".
 */
export function useDiagnosticHref(): string {
  const { user } = useAuth()
  const assistantEnabled = useFeatureFlag("ai_assistant_flag")
  return user && assistantEnabled ? "/assistant?mode=diagnostic" : "/quiz"
}
