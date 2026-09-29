import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import type { MenteeContextItem } from "./community-match.service"

/** Upper bound on profiles sent to the LLM — this is what drives prompt cost. */
export const MAX_MENTEE_CANDIDATES = 100

const COLUMNS = "id, full_name, job_title, bio, expertise_areas"

/**
 * Retrieval step of the community AI match: which mentee/learner profiles the
 * LLM gets to choose from when a mentor describes who they'd like to help.
 *
 * Mirrors `getMentorCandidates` — same "send everyone, swap for an index
 * later" shortcut, same excludes-active-mentors filter the Community wall
 * itself uses, so the candidate pool always matches what a mentor could open
 * on `/community`.
 */
export async function getMenteeCandidates(
  supabase: SupabaseClient<Database>
): Promise<MenteeContextItem[]> {
  const { data: mentorRows } = await (supabase.from("mentors_view") as any).select("id")
  const mentorIds = ((mentorRows as Array<{ id: string | null }>) || [])
    .map((m) => m.id)
    .filter((id): id is string => Boolean(id))

  let query = (supabase.from("profiles") as any)
    .select(COLUMNS)
    .eq("is_public", true)
    .not("bio", "is", null)
    .order("created_at", { ascending: false })
    .limit(MAX_MENTEE_CANDIDATES)

  if (mentorIds.length > 0) {
    query = query.not("id", "in", `(${mentorIds.join(",")})`)
  }

  const { data } = await query

  return ((data as Array<{
    id: string | null
    full_name: string | null
    job_title: string | null
    bio: string | null
    expertise_areas: string[] | null
  }>) ?? [])
    .filter((p): p is typeof p & { id: string } => !!p.id)
    .map((p) => ({ ...p, full_name: p.full_name ?? "Membro" }))
}
