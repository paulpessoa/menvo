"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { resolveMentorSlugsAction } from "@/app/actions/mentors"
import { qk } from "@/lib/query/keys"

export interface MentorSlugMaps {
  /** nome (minúsculo) -> slug do perfil, ou id se o mentor não tiver slug */
  slugByName: Record<string, string>
  /** nome (minúsculo) -> id do mentor */
  idByName: Record<string, string>
}

const EMPTY: MentorSlugMaps = { slugByName: {}, idByName: {} }

/**
 * Resolves the mentor names the AI suggested to real profiles. Best effort:
 * on failure the suggestions still render, linking to a search by name.
 */
export function useMentorSlugs(names: readonly string[]): MentorSlugMaps {
  const { data } = useQuery({
    queryKey: qk.mentors.slugs(names),
    enabled: names.length > 0,
    retry: false,
    queryFn: async () => {
      try {
        return await resolveMentorSlugsAction([...names])
      } catch (error) {
        console.warn("Could not resolve mentor slugs:", error)
        return []
      }
    },
  })

  return useMemo(() => {
    if (!data || data.length === 0) return EMPTY
    const maps: MentorSlugMaps = { slugByName: {}, idByName: {} }
    for (const m of data) {
      if (!m.full_name) continue
      const key = m.full_name.toLowerCase()
      maps.slugByName[key] = m.slug || m.id || ""
      maps.idByName[key] = m.id || ""
    }
    return maps
  }, [data])
}
