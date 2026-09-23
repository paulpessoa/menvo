import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import type { MentorContextItem } from "./match.service"

/** Upper bound on mentors sent to the LLM — this is what drives prompt cost. */
export const MAX_CANDIDATES = 100

const COLUMNS = "id, full_name, job_title, mentor_skills, expertise_areas, mentorship_topics, bio"

/**
 * Retrieval step of AI matching: which mentors the LLM gets to choose from.
 *
 * This is the ONE place to change when the catalog outgrows "send everyone":
 * swap the query for Postgres full-text search or pgvector top-K here, and the
 * route, quota and metering stay untouched. Today (< 100 verified mentors)
 * sending the newest verified mentors is cheaper and simpler than any index.
 *
 * Falls back to unverified mentors only when no verified mentor exists, so an
 * empty catalog in a fresh environment still demos.
 */
export async function getMentorCandidates(
  supabase: SupabaseClient<Database>,
  { includeUnverified = false }: { includeUnverified?: boolean } = {}
): Promise<MentorContextItem[]> {
  let query = supabase
    .from("mentors_view")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(MAX_CANDIDATES)
  if (!includeUnverified) query = query.eq("verified", true)

  let { data } = await query
  if (!data || data.length === 0) {
    ;({ data } = await supabase.from("mentors_view").select(COLUMNS).limit(MAX_CANDIDATES))
  }

  return (data ?? [])
    .filter((m): m is typeof m & { id: string } => !!m.id)
    .map((m) => ({ ...m, full_name: m.full_name ?? "Mentor" }))
}
