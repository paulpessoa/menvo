"use client"

import { useSyncExternalStore } from "react"

/**
 * Whether a CSS media query matches, kept in sync with resizes.
 * Why: hiding a component with Tailwind (`hidden md:flex`) still mounts it, so
 * layouts that render a desktop and a mobile copy run every effect twice. For
 * components with side effects (e.g. a realtime channel per conversation) the
 * page must mount only one copy; this hook picks which.
 * On the server it reports `false`; the client corrects it right after hydration.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}
