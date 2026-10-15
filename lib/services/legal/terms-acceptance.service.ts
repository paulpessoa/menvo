import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { CURRENT_TERMS_VERSION } from "@/lib/legal/terms"

/** Postgres unique_violation: the (user_id, terms_version) pair already exists. */
const UNIQUE_VIOLATION = "23505"

/** Longest user agent we store; mirrors the `char_length <= 400` table check. */
const USER_AGENT_MAX_LENGTH = 400

/**
 * Whether the user has accepted the current version of the Terms of Use.
 *
 * Takes the caller's own (RLS-scoped) client on purpose: the "Users read own
 * terms acceptances" policy already limits the read to `auth.uid()`, so a
 * wrong `userId` can only ever come back as "not accepted".
 *
 * @throws When the query fails, so callers don't mistake an outage for
 *   "not accepted" and lock everyone behind the gate.
 */
export async function hasAcceptedCurrentTerms(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("terms_acceptances")
    .select("id")
    .eq("user_id", userId)
    .eq("terms_version", CURRENT_TERMS_VERSION)
    .maybeSingle()

  if (error) {
    throw new Error(`Erro ao verificar aceite dos termos: ${error.message}`)
  }
  return data !== null
}

/**
 * Records that the user accepted the current Terms version.
 *
 * Plain `insert`, never `upsert`: the table is append-only (no UPDATE
 * permission), and `accepted_at` comes from the database so the client can't
 * backdate an acceptance. A duplicate means they already accepted this
 * version, which is the outcome we wanted, so it counts as success and keeps
 * the original timestamp.
 *
 * @throws On any database error other than a duplicate acceptance.
 */
export async function recordTermsAcceptance(
  supabase: SupabaseClient<Database>,
  userId: string,
  userAgent: string | null,
): Promise<void> {
  const { error } = await supabase.from("terms_acceptances").insert({
    user_id: userId,
    terms_version: CURRENT_TERMS_VERSION,
    user_agent: userAgent ? userAgent.slice(0, USER_AGENT_MAX_LENGTH) : null,
  })

  if (error && error.code !== UNIQUE_VIOLATION) {
    throw new Error(`Erro ao registrar aceite dos termos: ${error.message}`)
  }
}
