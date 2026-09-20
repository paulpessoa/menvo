"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"

// `ssr: false` is only allowed inside a Client Component, so the root layout
// (a Server Component) renders this wrapper instead of calling dynamic() itself.
const FeedbackBanner = dynamic(
  () => import("@/components/FeedbackBanner").then((m) => m.FeedbackBanner),
  { ssr: false }
)
const ConsoleEasterEgg = dynamic(
  () => import("@/components/ConsoleEasterEgg").then((m) => m.ConsoleEasterEgg),
  { ssr: false }
)
/**
 * Deferred wrapper for FounderPitchWidget.
 * The widget is entirely client-side (localStorage, timers, iframe) and must
 * never be server-rendered. Loading it lazily after idle keeps it completely
 * off the critical render path.
 */
const FounderPitchWidget = dynamic(
  () =>
    import("@/components/FounderPitchWidget").then((m) => m.FounderPitchWidget),
  { ssr: false }
)

const CookieConsentBanner = dynamic(
  () => import("@/components/cookie-consent-banner").then((m) => m.CookieConsentBanner),
  { ssr: false }
)

export function DeferredConsoleEasterEgg() {
  return <ConsoleEasterEgg />
}

export function DeferredFeedbackBanner() {
  return <FeedbackBanner />
}

export function DeferredFounderPitchWidget() {
  return <FounderPitchWidget />
}

export function DeferredCookieConsentBanner() {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    // Atrasa a renderização do banner em 3.5 segundos para não competir com a hidratação inicial
    const timer = setTimeout(() => {
      setShouldRender(true)
    }, 3500)
    return () => clearTimeout(timer)
  }, [])

  if (!shouldRender) return null

  return <CookieConsentBanner />
}
