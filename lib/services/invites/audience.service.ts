import { createServiceRoleClient, ensureServerSide } from "@/lib/utils/supabase/service-role"
import { hashEmail } from "@/lib/services/invites/suppression.service"

const PAGE_SIZE = 1000

/**
 * Reads every row of a query page by page. PostgREST silently caps a
 * response at 1000 rows, so a plain select would quietly drop part of the
 * audience once the table grows past that (this bit an earlier version of
 * `resolveAudience` - see docs/domains/account-retention.md). `buildPage`
 * must apply a stable order so paging never skips or repeats a row.
 */
export async function fetchAllRows<T>(
  buildPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildPage(from, from + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) return rows
  }
}

export interface JotformProfile {
  id: string
  email: string | null
  full_name: string | null
  email_opt_out_at: string | null
}

/**
 * Profiles imported from JotForm, read from `import_records` (the origin lives
 * there, not on `profiles`) joined to the profile fields in one paged query,
 * so there is no per-user lookup. Shared by the invite audience and the
 * retention run so both agree on who counts as "imported".
 */
export async function fetchJotformProfiles(
  supabase: ReturnType<typeof createServiceRoleClient>
): Promise<JotformProfile[]> {
  const rows = await fetchAllRows((from, to) =>
    supabase
      .from("import_records")
      .select("user_id, profiles!inner(email, full_name, email_opt_out_at)")
      .eq("origin_platform", "jotform")
      .order("user_id")
      .range(from, to)
  )
  return rows.map(row => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id: row.user_id,
      email: profile?.email ?? null,
      full_name: profile?.full_name ?? null,
      email_opt_out_at: profile?.email_opt_out_at ?? null
    }
  })
}

export type InviteAudience = "selected" | "jotform_not_invited" | "never_signed_in" | "all" | "unresponsive_invitees"

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
 * the Admin API (there is no way to filter this from PostgREST - the
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
 * reengagement campaign can actually reach - after removing anyone
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

  if (params.audience === "selected" && !params.userIds?.length) {
    return { eligible: [], skipped: { suppressed: 0, optedOut: 0, alreadyInvited: 0, noEmail: 0 } }
  }

  const profiles =
    params.audience === "jotform_not_invited"
      ? await fetchJotformProfiles(supabase)
      : await fetchAllRows((from, to) => {
          let query = supabase.from("profiles").select("id, email, full_name, email_opt_out_at").order("id")
          if (params.audience === "selected") query = query.in("id", params.userIds!)
          // "all" and "never_signed_in" start from every profile; never_signed_in is filtered below.
          return query.range(from, to)
        })

  let candidates = profiles

  if (params.audience === "never_signed_in") {
    const signedIn = await fetchSignedInUserIds()
    candidates = candidates.filter(p => !signedIn.has(p.id))
  } else if (params.audience === "unresponsive_invitees") {
    const unopened = await fetchAllRows((from, to) =>
      supabase.from("reengagement_invites").select("user_id").is("opened_at", null).order("user_id").range(from, to)
    )
    const unopenedIds = new Set(unopened.map(row => row.user_id))
    candidates = candidates.filter(p => unopenedIds.has(p.id))
  }

  const skipped = { suppressed: 0, optedOut: 0, alreadyInvited: 0, noEmail: 0 }
  const eligible: AudienceCandidate[] = []

  // Two lookups done once up front (never per-candidate) to avoid N+1
  // queries: which of these profiles already have an invite for this
  // campaign, and which of their e-mails are on the do-not-contact list.
  const existingInvites = await fetchAllRows((from, to) =>
    supabase.from("reengagement_invites").select("user_id").eq("campaign", params.campaign).order("user_id").range(from, to)
  )
  const alreadyInvitedIds = new Set(existingInvites.map(row => row.user_id))

  const suppressions = await fetchAllRows((from, to) =>
    supabase.from("email_suppressions").select("email_hash").order("email_hash").range(from, to)
  )
  const suppressedHashes = new Set(suppressions.map(row => row.email_hash))

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
