import { notFound } from "next/navigation"

/**
 * Catch-all for any path under a locale that doesn't match a real page.
 *
 * Without this, an unknown URL never matches anything under app/[locale]/,
 * so Next.js can't even mount [locale]/layout.tsx (which imports
 * globals.css and validates the locale) — it falls straight through to the
 * root app/not-found.tsx, which renders unstyled because it never goes
 * through that layout. Calling notFound() from inside a page that *did*
 * match makes Next.js use the properly branded app/[locale]/not-found.tsx
 * instead.
 */
export default function CatchAll() {
  notFound()
}
