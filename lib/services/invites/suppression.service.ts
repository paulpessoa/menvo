import { createHash } from "crypto"
import { createServiceRoleClient, ensureServerSide } from "@/lib/utils/supabase/service-role"

/**
 * The do-not-contact list (`email_suppressions`) is keyed by a hash, never
 * the plaintext e-mail — once someone asks to be deleted we should still be
 * able to recognize them on a future JotForm re-import without retaining
 * their address. This is the single place that hash is computed, so every
 * caller normalizes the same way (lowercased, trimmed) before hashing.
 */
export function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex")
}

/**
 * True if this e-mail asked to be deleted or opted out before. Callers
 * (bulk invite send, future JotForm import) must skip suppressed
 * addresses — sending to them again would defeat the LGPD request that put
 * them here.
 */
export async function isSuppressed(email: string): Promise<boolean> {
  ensureServerSide()
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("email_suppressions")
    .select("email_hash")
    .eq("email_hash", hashEmail(email))
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

/**
 * Adds an e-mail to the do-not-contact list. Idempotent: suppressing an
 * already-suppressed address just no-ops (upsert), which matters because
 * both the invite-response flow and the admin delete flow can call this
 * for the same person.
 */
export async function suppress(email: string, reason: "deleted" | "opted_out"): Promise<void> {
  ensureServerSide()
  const supabase = createServiceRoleClient()
  const { error } = await supabase
    .from("email_suppressions")
    .upsert({ email_hash: hashEmail(email), reason }, { onConflict: "email_hash" })

  if (error) throw error
}
