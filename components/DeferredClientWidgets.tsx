"use client"

import dynamic from "next/dynamic"

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

export function DeferredConsoleEasterEgg() {
  return <ConsoleEasterEgg />
}

export function DeferredFeedbackBanner() {
  return <FeedbackBanner />
}
