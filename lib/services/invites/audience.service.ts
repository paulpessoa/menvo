import { createServiceRoleClient, ensureServerSide } from "@/lib/utils/supabase/service-role"
import { hashEmail } from "@/lib/services/invites/suppression.service"

export type InviteAudience = "selected" | "jotform_not_invited" | "never_signed_in" | "all"

export interface AudienceCandidate {
  id: string
  email: string
  full_name: string | null
}

export interface ResolveAudienceResult {
  eligible: AudienceCandidate[]
  skipped: {
    suppressed: number
    optedOut: number
    alreadyInvited: number
    noEmail: number
  }
}

/**
 * Every user ID with at least one auth.users sign-in, paginating through
 * the Admin API (there is no way to filter this from PostgREST — the
 * `auth` schema isn't exposed to it). Used only by the "never signed in"
 * audience, an infrequent admin action, so the O(users) scan is fine.
 */
export async function fetchSignedInUserIds(): Promise<Set<string>> {
  const supabase = createServiceRoleClient()
  const signedIn = new Set<string>()
  const perPage = 1000
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    for (const user of data.users) {
      if (user.last_sign_in_at) signedIn.add(user.id)
    }
    if (data.users.length < perPage) break
    page += 1
  }

  return signedIn
}

/**
 * Turns an admin-chosen audience into the concrete list of people a
 * reengagement campaign can actually reach — after removing anyone
 * suppressed (asked to be deleted/opted out), opted out via
 * `profiles.email_opt_out_at`, or already invited for this exact
 * campaign (unless `resend` is set). Shared by the count-preview
 * endpoint and the send endpoint so what the admin previews is exactly
 * who gets an e-mail.
 */
export async function resolveAudience(params: {
  audience: InviteAudience
  campaign: string
  userIds?: string[]
  resend?: boolean
}): Promise<ResolveAudienceResult> {
  ensureServerSide()
  const supabase = createServiceRoleClient()

  let query = supabase
    .from("profiles")
    .select("id, email, full_name, email_opt_out_at")

  if (params.audience === "selected") {
    if (!params.userIds?.length) return { eligible: [], skipped: { suppressed: 0, optedOut: 0, alreadyInvited: 0, noEmail: 0 } }
    query = query.in("id", params.userIds)
  } else if (params.audience === "jotform_not_invited") {
    query = query.eq("origin_platform", "jotform")
  }
  // "all" and "never_signed_in" start from every profile; never_signed_in is filtered below.

  const { data: profiles, error } = await query
  if (error) throw error

  let candidates = profiles ?? []

  if (params.audience === "never_signed_in") {
    const signedIn = await fetchSignedInUserIds()
    candidates = candidates.filter(p => !signedIn.has(p.id))
  }

  const skipped = { suppressed: 0, optedOut: 0, alreadyInvited: 0, noEmail: 0 }
  const eligible: AudienceCandidate[] = []

  // Two lookups done once up front (never per-candidate) to avoid N+1
  // queries: which of these profiles already have an invite for this
  // campaign, and which of their e-mails are on the do-not-contact list.
  const { data: existingInvites } = await supabase
    .from("reengagement_invites")
    .select("user_id")
    .eq("campaign", params.campaign)

  const alreadyInvitedIds = new Set((existingInvites ?? []).map(row => row.user_id))

  const { data: suppressions } = await supabase.from("email_suppressions").select("email_hash")
  const suppressedHashes = new Set((suppressions ?? []).map(row => row.email_hash))

  for (const profile of candidates) {
    if (!profile.email) {
      skipped.noEmail += 1
      continue
    }
    if (profile.email_opt_out_at) {
      skipped.optedOut += 1
      continue
    }
    if (!params.resend && alreadyInvitedIds.has(profile.id)) {
      skipped.alreadyInvited += 1
      continue
    }
    if (suppressedHashes.has(hashEmail(profile.email))) {
      skipped.suppressed += 1
      continue
    }
    eligible.push({ id: profile.id, email: profile.email, full_name: profile.full_name })
  }

  return { eligible, skipped }
}
