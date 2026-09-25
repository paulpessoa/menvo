/**
 * Executes the account retention plan produced by `planRetentionActions`:
 * loads state, enrolls/releases queue rows, sends the 30-day/1-day
 * warnings, and deletes accounts whose deadline has passed. See
 * docs/domains/account-retention.md for the design and invariants.
 */
import { createServiceRoleClient, ensureServerSide } from "@/lib/utils/supabase/service-role"
import { fetchSignedInUserIds } from "@/lib/services/invites/audience.service"
import { hashEmail } from "@/lib/services/invites/suppression.service"
import { createInviteToken } from "@/lib/services/invites/invite-token.service"
import { deleteUserCompletely } from "@/lib/services/admin/delete-user.service"
import {
  sendRetentionNotice,
  sendRetentionDeletionConfirmation
} from "@/lib/email/brevo"
import {
  planRetentionActions,
  type RetentionAction,
  type RetentionCandidate,
  type RetentionQueueRow,
  type RetentionState
} from "@/lib/services/retention/retention.service"

export interface RetentionRunOptions {
  /** `dry_run` computes and logs the plan but performs no writes or sends. */
  mode: "dry_run" | "live"
  /** Caps how many notice e-mails (30d + 1d combined) this run sends. */
  maxEmails: number
  /** Caps how many accounts this run deletes. */
  maxDeletions: number
  /** Epoch ms after which no new send/deletion starts (leftovers are deferred), to stay inside the function timeout. */
  deadline?: number
}

export interface RetentionReport {
  mode: RetentionRunOptions["mode"]
  planned: Record<RetentionAction["kind"], number>
  released: string[]
  enrolled: string[]
  deleted: string[]
  noticed30d: string[]
  noticed1d: string[]
  deferredToNextRun: { emails: number; deletions: number }
  errors: { userId: string; action: RetentionAction["kind"]; message: string }[]
}

function emptyReport(mode: RetentionRunOptions["mode"]): RetentionReport {
  return {
    mode,
    planned: { release: 0, enroll: 0, delete: 0, notice_1d: 0, notice_30d: 0 },
    released: [],
    enrolled: [],
    deleted: [],
    noticed30d: [],
    noticed1d: [],
    deferredToNextRun: { emails: 0, deletions: 0 },
    errors: []
  }
}

const PAGE_SIZE = 1000

/**
 * Reads every row of a query page by page. PostgREST silently caps a
 * response at 1000 rows, so a plain select would quietly drop part of the
 * cohort once it grows past that. `buildPage` must apply a stable order.
 */
async function fetchAllRows<T>(
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

/**
 * Loads everything `planRetentionActions` needs with a fixed set of paged
 * reads (no per-user loop, no id list in the URL), so the read side stays
 * correct and cheap as the imported cohort grows.
 */
async function loadRetentionState(): Promise<{
  state: RetentionState
  /** profile lookup kept around for the write phase (e-mail/name for sends and pre-deletion capture) */
  profilesById: Map<string, { email: string | null; full_name: string | null }>
}> {
  const supabase = createServiceRoleClient()

  const profiles = await fetchAllRows((from, to) =>
    supabase
      .from("profiles")
      .select("id, email, full_name, email_opt_out_at")
      .eq("origin_platform", "jotform")
      .order("id")
      .range(from, to)
  )
  const profilesById = new Map(profiles.map(p => [p.id, { email: p.email, full_name: p.full_name }]))

  const invites = await fetchAllRows((from, to) =>
    supabase.from("reengagement_invites").select("user_id, campaign, sent_at").order("id").range(from, to)
  )

  const firstInviteByUser = new Map<string, { campaign: string; sentAt: string }>()
  for (const invite of invites) {
    if (!profilesById.has(invite.user_id)) continue
    const current = firstInviteByUser.get(invite.user_id)
    if (!current || new Date(invite.sent_at) < new Date(current.sentAt)) {
      firstInviteByUser.set(invite.user_id, { campaign: invite.campaign, sentAt: invite.sent_at })
    }
  }

  const suppressions = await fetchAllRows((from, to) =>
    supabase.from("email_suppressions").select("email_hash").order("email_hash").range(from, to)
  )
  const suppressedHashes = new Set(suppressions.map(row => row.email_hash))

  const queueRows = await fetchAllRows((from, to) =>
    supabase.from("account_retention").select("*").order("user_id").range(from, to)
  )

  const signedInUserIds = await fetchSignedInUserIds()

  const candidates: RetentionCandidate[] = []
  for (const profile of profiles) {
    const firstInvite = firstInviteByUser.get(profile.id)
    if (!firstInvite) continue // never invited: not a candidate at all
    const optedOut = Boolean(profile.email_opt_out_at) || (profile.email ? suppressedHashes.has(hashEmail(profile.email)) : false)
    candidates.push({
      userId: profile.id,
      campaign: firstInvite.campaign,
      firstInvitedAt: firstInvite.sentAt,
      optedOut
    })
  }

  const queue: RetentionQueueRow[] = queueRows.map(row => ({
    userId: row.user_id,
    campaign: row.campaign,
    clockStartedAt: row.clock_started_at,
    noticeThirtyDaySentAt: row.notice_30d_sent_at,
    scheduledDeletionAt: row.scheduled_deletion_at,
    noticeOneDaySentAt: row.notice_1d_sent_at
  }))

  return { state: { candidates, queue, signedInUserIds }, profilesById }
}

function buildInviteUrl(token: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br"
  return `${appUrl}/convite/${token}`
}

async function applyRelease(supabase: ReturnType<typeof createServiceRoleClient>, userId: string) {
  const { error } = await supabase.from("account_retention").delete().eq("user_id", userId)
  if (error) throw error
}

async function applyEnroll(
  supabase: ReturnType<typeof createServiceRoleClient>,
  action: Extract<RetentionAction, { kind: "enroll" }>
) {
  const { error } = await supabase.from("account_retention").insert({
    user_id: action.userId,
    campaign: action.campaign,
    clock_started_at: action.clockStartedAt
  })
  if (error) throw error
}

/**
 * Sends a retention notice, claiming the corresponding `*_sent_at` column
 * first so two concurrent/retried runs can't both send it. If the send
 * fails, the claim is rolled back so a later run retries.
 */
async function sendNoticeWithClaim(params: {
  supabase: ReturnType<typeof createServiceRoleClient>
  userId: string
  stage: "30d" | "1d"
  profile: { email: string | null; full_name: string | null } | undefined
  campaign: string
  scheduledDeletionAt: string | null
}): Promise<{ sent: boolean; error?: string }> {
  const { supabase, userId, stage, profile, campaign } = params
  const claimColumn = stage === "30d" ? "notice_30d_sent_at" : "notice_1d_sent_at"
  const now = new Date().toISOString()

  const claimUpdate: Record<string, string> =
    stage === "30d"
      ? { notice_30d_sent_at: now, scheduled_deletion_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }
      : { notice_1d_sent_at: now }

  // Mirrors claimUpdate's keys with nulls: the `retention_schedule_set` DB
  // constraint requires notice_30d_sent_at and scheduled_deletion_at to be
  // set/unset together, so a rolled-back 30-day claim must clear both.
  const rollbackUpdate: Record<string, null> =
    stage === "30d" ? { notice_30d_sent_at: null, scheduled_deletion_at: null } : { notice_1d_sent_at: null }

  const { data: claimed, error: claimError } = await supabase
    .from("account_retention")
    .update(claimUpdate)
    .eq("user_id", userId)
    .is(claimColumn, null)
    .select("user_id")
    .maybeSingle()

  if (claimError) return { sent: false, error: claimError.message }
  if (!claimed) return { sent: false } // already claimed by another run

  if (!profile?.email) {
    await supabase.from("account_retention").update(rollbackUpdate).eq("user_id", userId)
    return { sent: false, error: "profile has no e-mail" }
  }

  try {
    const { token } = await createInviteToken({
      userId,
      campaign,
      subject:
        stage === "30d"
          ? "Sua conta na Menvo será apagada em 30 dias"
          : "Último aviso: sua conta na Menvo será apagada amanhã",
      sentBy: null,
      resend: true
    })

    const deletionDate = stage === "30d" ? claimUpdate.scheduled_deletion_at! : params.scheduledDeletionAt!

    const result = await sendRetentionNotice({
      name: profile.full_name || "",
      email: profile.email,
      inviteUrl: buildInviteUrl(token),
      deletionDate,
      daysLeft: stage === "30d" ? 30 : 1
    })

    if (!result.success) {
      await supabase.from("account_retention").update(rollbackUpdate).eq("user_id", userId)
      return { sent: false, error: result.error }
    }

    return { sent: true }
  } catch (err) {
    await supabase.from("account_retention").update(rollbackUpdate).eq("user_id", userId)
    return { sent: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Runs the retention plan once. Order matches `planRetentionActions`:
 * releases and enrollments first (cheap, no external calls), then
 * deletions (so they never get stuck behind the e-mail cap), then the 1-day
 * and 30-day notices, each capped by `maxEmails`/`maxDeletions` — whatever
 * doesn't fit this run is picked up by the next one, and the timing
 * invariants in retention.service.ts guarantee that delay only ever pushes
 * a deletion later, never earlier.
 */
export async function runRetention(options: RetentionRunOptions): Promise<RetentionReport> {
  ensureServerSide()
  const supabase = createServiceRoleClient()
  const report = emptyReport(options.mode)

  const { state, profilesById } = await loadRetentionState()
  const actions = planRetentionActions(state, new Date())
  for (const action of actions) report.planned[action.kind] += 1

  if (options.mode === "dry_run") {
    for (const action of actions) {
      if (action.kind === "release") report.released.push(action.userId)
      else if (action.kind === "enroll") report.enrolled.push(action.userId)
      else if (action.kind === "delete") report.deleted.push(action.userId)
      else if (action.kind === "notice_1d") report.noticed1d.push(action.userId)
      else if (action.kind === "notice_30d") report.noticed30d.push(action.userId)
    }
    return report
  }

  const queueByUser = new Map(state.queue.map(row => [row.userId, row]))
  const outOfTime = () => options.deadline !== undefined && Date.now() >= options.deadline
  let emailsSent = 0
  let deletionsDone = 0

  for (const action of actions) {
    if (action.kind === "release") {
      try {
        await applyRelease(supabase, action.userId)
        report.released.push(action.userId)
      } catch (err) {
        report.errors.push({ userId: action.userId, action: action.kind, message: errMsg(err) })
      }
    }
  }

  for (const action of actions) {
    if (action.kind === "enroll") {
      try {
        await applyEnroll(supabase, action)
        report.enrolled.push(action.userId)
      } catch (err) {
        report.errors.push({ userId: action.userId, action: action.kind, message: errMsg(err) })
      }
    }
  }

  for (const action of actions) {
    if (action.kind !== "delete") continue
    if (deletionsDone >= options.maxDeletions || outOfTime()) {
      report.deferredToNextRun.deletions += 1
      continue
    }

    try {
      // Re-check sign-in status right before deleting: the signed-in set
      // was loaded at the start of this run and the person may have logged
      // in since (invariant 4 in the doc).
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(action.userId)
      if (authError) throw authError
      if (authUser.user?.last_sign_in_at) {
        await applyRelease(supabase, action.userId)
        report.released.push(action.userId)
        continue
      }

      const profile = profilesById.get(action.userId)
      const email = profile?.email ?? null
      const fullName = profile?.full_name ?? null

      await deleteUserCompletely(action.userId, { source: "retention_policy" })
      deletionsDone += 1
      report.deleted.push(action.userId)

      if (action.notify && email) {
        const result = await sendRetentionDeletionConfirmation({ name: fullName || "", email })
        if (!result.success) {
          report.errors.push({ userId: action.userId, action: action.kind, message: `deleted but confirmation failed: ${result.error}` })
        }
      }
    } catch (err) {
      report.errors.push({ userId: action.userId, action: action.kind, message: errMsg(err) })
    }
  }

  for (const action of actions) {
    if (action.kind !== "notice_1d") continue
    if (emailsSent >= options.maxEmails || outOfTime()) {
      report.deferredToNextRun.emails += 1
      continue
    }
    const row = queueByUser.get(action.userId)
    const result = await sendNoticeWithClaim({
      supabase,
      userId: action.userId,
      stage: "1d",
      profile: profilesById.get(action.userId),
      campaign: row?.campaign ?? "",
      scheduledDeletionAt: row?.scheduledDeletionAt ?? null
    })
    if (result.sent) {
      emailsSent += 1
      report.noticed1d.push(action.userId)
    } else if (result.error) {
      report.errors.push({ userId: action.userId, action: action.kind, message: result.error })
    }
  }

  for (const action of actions) {
    if (action.kind !== "notice_30d") continue
    if (emailsSent >= options.maxEmails || outOfTime()) {
      report.deferredToNextRun.emails += 1
      continue
    }
    const row = queueByUser.get(action.userId)
    const result = await sendNoticeWithClaim({
      supabase,
      userId: action.userId,
      stage: "30d",
      profile: profilesById.get(action.userId),
      campaign: row?.campaign ?? "",
      scheduledDeletionAt: null
    })
    if (result.sent) {
      emailsSent += 1
      report.noticed30d.push(action.userId)
    } else if (result.error) {
      report.errors.push({ userId: action.userId, action: action.kind, message: result.error })
    }
  }

  return report
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
