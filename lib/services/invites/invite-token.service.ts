import { randomBytes, createHash } from "crypto"
import { createServiceRoleClient, ensureServerSide } from "@/lib/utils/supabase/service-role"
import type { Database } from "@/lib/types/supabase"

type ReengagementInvite = Database["public"]["Tables"]["reengagement_invites"]["Row"]
type InviteResponse = NonNullable<ReengagementInvite["response"]>

export interface InviteProfile {
  id: string
  email: string
  full_name: string | null
}

export type ResolveInviteResult =
  | { ok: true; invite: ReengagementInvite; profile: InviteProfile }
  | { ok: false; reason: "invalid" | "expired" }

const TOKEN_BYTES = 32

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

/**
 * Creates (or, with `resend`, rotates) the invite token for one person in
 * one campaign. The plaintext token is returned once, embedded in the
 * e-mail, and never stored — only its sha256 hash lives in
 * `reengagement_invites.token_hash`, so a database leak alone can't be
 * used to impersonate a recipient's accept/delete link.
 *
 * Rotating (`resend: true`) also clears `response`/`opened_at` so someone
 * who already responded can be re-invited for a later campaign wave, or
 * get a fresh link after their first one expired.
 */
export async function createInviteToken(params: {
  userId: string
  campaign: string
  subject: string
  /** Admin who triggered the send, or `null` for a system-generated e-mail (e.g. the retention cron's warnings). */
  sentBy: string | null
  resend?: boolean
}): Promise<{ token: string; inviteId: string }> {
  ensureServerSide()
  const supabase = createServiceRoleClient()

  const token = randomBytes(TOKEN_BYTES).toString("base64url")
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from("reengagement_invites")
    .upsert(
      {
        user_id: params.userId,
        campaign: params.campaign,
        token_hash: tokenHash,
        subject: params.subject,
        sent_by: params.sentBy,
        sent_at: new Date().toISOString(),
        expires_at: expiresAt,
        ...(params.resend ? { opened_at: null, response: null, responded_at: null } : {})
      },
      { onConflict: "user_id,campaign" }
    )
    .select("id")
    .single()

  if (error) throw error
  return { token, inviteId: data.id }
}

/**
 * Looks up an invite by its plaintext token (from the URL) and returns the
 * invite row plus the recipient's profile — or a reason the link can't be
 * used. Does not check `response`: a link that was already answered still
 * *resolves*, so the caller (the /convite/[token] page) can render an
 * "you already responded" state instead of a generic error. Never reveals
 * whether a token merely doesn't exist vs. belongs to someone else —
 * both come back as "invalid".
 */
export async function resolveInviteToken(token: string): Promise<ResolveInviteResult> {
  ensureServerSide()
  if (!token || token.length < 20) return { ok: false, reason: "invalid" }

  const supabase = createServiceRoleClient()
  const { data: invite, error } = await supabase
    .from("reengagement_invites")
    .select("*")
    .eq("token_hash", hashToken(token))
    .maybeSingle()

  if (error) throw error
  if (!invite) return { ok: false, reason: "invalid" }
  if (new Date(invite.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", invite.user_id)
    .maybeSingle()

  if (profileError) throw profileError
  if (!profile) return { ok: false, reason: "invalid" }

  return { ok: true, invite, profile }
}

/** Records the first time the response page was opened. Never changes state beyond that timestamp — opening a link must stay side-effect free (see docs/domains/reengagement-invites.md §3.2). */
export async function markOpened(inviteId: string): Promise<void> {
  ensureServerSide()
  const supabase = createServiceRoleClient()
  const { data: invite } = await supabase
    .from("reengagement_invites")
    .select("opened_at")
    .eq("id", inviteId)
    .maybeSingle()

  if (invite && !invite.opened_at) {
    await supabase
      .from("reengagement_invites")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", inviteId)
  }
}

/**
 * Records the recipient's final choice. Only succeeds once per invite —
 * returns `false` (instead of overwriting) if this invite already has a
 * response, so a replayed or double-clicked POST can't flip an already
 * "deleted" invite back to "accepted", and can't be used to re-trigger a
 * deletion against a profile that no longer exists.
 */
export async function markResponse(inviteId: string, response: InviteResponse): Promise<boolean> {
  ensureServerSide()
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from("reengagement_invites")
    .update({ response, responded_at: new Date().toISOString() })
    .eq("id", inviteId)
    .is("response", null)
    .select("id")
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}
