/**
 * @jest-environment node
 */
import { runRetention } from "./run-retention.service"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { fetchSignedInUserIds } from "@/lib/services/invites/audience.service"
import { createInviteToken } from "@/lib/services/invites/invite-token.service"
import { deleteUserCompletely } from "@/lib/services/admin/delete-user.service"
import { sendRetentionNotice, sendRetentionDeletionConfirmation } from "@/lib/email/brevo"

jest.mock("@/lib/utils/supabase/service-role", () => ({
  createServiceRoleClient: jest.fn(),
  ensureServerSide: jest.fn()
}))

jest.mock("@/lib/services/invites/audience.service", () => ({
  fetchSignedInUserIds: jest.fn()
}))

jest.mock("@/lib/services/invites/invite-token.service", () => ({
  createInviteToken: jest.fn().mockResolvedValue({ token: "tok-123", inviteId: "invite-1" })
}))

jest.mock("@/lib/services/admin/delete-user.service", () => ({
  deleteUserCompletely: jest.fn().mockResolvedValue({ success: true, filesRemoved: 0 })
}))

jest.mock("@/lib/email/brevo", () => ({
  sendRetentionNotice: jest.fn().mockResolvedValue({ success: true }),
  sendRetentionDeletionConfirmation: jest.fn().mockResolvedValue({ success: true })
}))

const DAY_MS = 24 * 60 * 60 * 1000
const isoDaysAgo = (days: number) => new Date(Date.now() - days * DAY_MS).toISOString()

interface Profile {
  id: string
  email: string | null
  full_name: string | null
  email_opt_out_at: string | null
}

interface Invite {
  user_id: string
  campaign: string
  sent_at: string
}

interface RetentionRow {
  user_id: string
  campaign: string
  clock_started_at: string
  notice_30d_sent_at: string | null
  scheduled_deletion_at: string | null
  notice_1d_sent_at: string | null
}

function buildSupabase(opts: {
  profiles: Profile[]
  invites: Invite[]
  suppressions?: { email_hash: string }[]
  queue: RetentionRow[]
  getUserById?: (id: string) => { last_sign_in_at: string | null }
}) {
  const queue = opts.queue

  const accountRetentionTable = {
    select: () => Promise.resolve({ data: queue.map(r => ({ ...r })), error: null }),
    delete: () => ({
      eq: (_col: string, val: string) => {
        const idx = queue.findIndex(r => r.user_id === val)
        if (idx >= 0) queue.splice(idx, 1)
        return Promise.resolve({ error: null })
      }
    }),
    insert: (row: RetentionRow) => {
      queue.push({ ...row, notice_30d_sent_at: null, scheduled_deletion_at: null, notice_1d_sent_at: null })
      return Promise.resolve({ error: null })
    },
    update: (patch: Record<string, unknown>) => ({
      eq: (_col: string, val: string) => {
        const chain: any = {
          is: (col2: string) => ({
            select: () => ({
              maybeSingle: async () => {
                const row = queue.find(r => r.user_id === val)
                if (!row) return { data: null, error: null }
                if ((row as any)[col2] !== null) return { data: null, error: null }
                Object.assign(row, patch)
                return { data: { user_id: val }, error: null }
              }
            })
          }),
          then: (resolve: (v: unknown) => void) => {
            const row = queue.find(r => r.user_id === val)
            if (row) Object.assign(row, patch)
            resolve({ error: null })
          }
        }
        return chain
      }
    })
  }

  const supabase = {
    from: jest.fn((table: string) => {
      if (table === "profiles") {
        return { select: () => ({ eq: () => Promise.resolve({ data: opts.profiles, error: null }) }) }
      }
      if (table === "reengagement_invites") {
        return { select: () => ({ in: () => ({ order: () => Promise.resolve({ data: opts.invites, error: null }) }) }) }
      }
      if (table === "email_suppressions") {
        return { select: () => Promise.resolve({ data: opts.suppressions ?? [], error: null }) }
      }
      if (table === "account_retention") {
        return accountRetentionTable
      }
      throw new Error(`unexpected table ${table}`)
    }),
    auth: {
      admin: {
        getUserById: jest.fn(async (id: string) => ({
          data: { user: opts.getUserById ? opts.getUserById(id) : { last_sign_in_at: null } },
          error: null
        }))
      }
    }
  }

  return { supabase, queue }
}

describe("runRetention", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetchSignedInUserIds as jest.Mock).mockResolvedValue(new Set())
  })

  it("dry_run computes the plan but performs no writes or sends", async () => {
    const { supabase, queue } = buildSupabase({
      profiles: [{ id: "u1", email: "u1@example.com", full_name: "User One", email_opt_out_at: null }],
      invites: [{ user_id: "u1", campaign: "estagiorecife-2026", sent_at: isoDaysAgo(5) }],
      queue: []
    })
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(supabase)

    const report = await runRetention({ mode: "dry_run", maxEmails: 100, maxDeletions: 25 })

    expect(report.enrolled).toEqual(["u1"])
    expect(queue).toEqual([]) // nothing actually written
    expect(sendRetentionNotice).not.toHaveBeenCalled()
    expect(deleteUserCompletely).not.toHaveBeenCalled()
  })

  it("live mode enrolls a new candidate by writing the queue row", async () => {
    const { supabase, queue } = buildSupabase({
      profiles: [{ id: "u1", email: "u1@example.com", full_name: "User One", email_opt_out_at: null }],
      invites: [{ user_id: "u1", campaign: "estagiorecife-2026", sent_at: isoDaysAgo(5) }],
      queue: []
    })
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(supabase)

    const report = await runRetention({ mode: "live", maxEmails: 100, maxDeletions: 25 })

    expect(report.enrolled).toEqual(["u1"])
    expect(queue).toHaveLength(1)
    expect(queue[0]).toMatchObject({ user_id: "u1", campaign: "estagiorecife-2026" })
  })

  it("live mode releases a queued account that has since signed in", async () => {
    const { supabase, queue } = buildSupabase({
      profiles: [{ id: "u1", email: "u1@example.com", full_name: "User One", email_opt_out_at: null }],
      invites: [{ user_id: "u1", campaign: "estagiorecife-2026", sent_at: isoDaysAgo(100) }],
      queue: [
        {
          user_id: "u1",
          campaign: "estagiorecife-2026",
          clock_started_at: isoDaysAgo(100),
          notice_30d_sent_at: null,
          scheduled_deletion_at: null,
          notice_1d_sent_at: null
        }
      ]
    })
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(supabase)
    ;(fetchSignedInUserIds as jest.Mock).mockResolvedValue(new Set(["u1"]))

    const report = await runRetention({ mode: "live", maxEmails: 100, maxDeletions: 25 })

    expect(report.released).toEqual(["u1"])
    expect(queue).toEqual([])
  })

  it("live mode sends the 30-day notice and claims it on the queue row", async () => {
    const { supabase, queue } = buildSupabase({
      profiles: [{ id: "u1", email: "u1@example.com", full_name: "User One", email_opt_out_at: null }],
      invites: [{ user_id: "u1", campaign: "estagiorecife-2026", sent_at: isoDaysAgo(60) }],
      queue: [
        {
          user_id: "u1",
          campaign: "estagiorecife-2026",
          clock_started_at: isoDaysAgo(60),
          notice_30d_sent_at: null,
          scheduled_deletion_at: null,
          notice_1d_sent_at: null
        }
      ]
    })
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(supabase)

    const report = await runRetention({ mode: "live", maxEmails: 100, maxDeletions: 25 })

    expect(report.noticed30d).toEqual(["u1"])
    expect(sendRetentionNotice).toHaveBeenCalledWith(expect.objectContaining({ email: "u1@example.com", daysLeft: 30 }))
    expect(queue[0].notice_30d_sent_at).not.toBeNull()
    expect(queue[0].scheduled_deletion_at).not.toBeNull()
  })

  it("rolls back the claim when the notice send fails", async () => {
    ;(sendRetentionNotice as jest.Mock).mockResolvedValueOnce({ success: false, error: "brevo down" })
    const { supabase, queue } = buildSupabase({
      profiles: [{ id: "u1", email: "u1@example.com", full_name: "User One", email_opt_out_at: null }],
      invites: [{ user_id: "u1", campaign: "estagiorecife-2026", sent_at: isoDaysAgo(60) }],
      queue: [
        {
          user_id: "u1",
          campaign: "estagiorecife-2026",
          clock_started_at: isoDaysAgo(60),
          notice_30d_sent_at: null,
          scheduled_deletion_at: null,
          notice_1d_sent_at: null
        }
      ]
    })
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(supabase)

    const report = await runRetention({ mode: "live", maxEmails: 100, maxDeletions: 25 })

    expect(report.noticed30d).toEqual([])
    expect(report.errors).toHaveLength(1)
    expect(queue[0].notice_30d_sent_at).toBeNull()
    expect(queue[0].scheduled_deletion_at).toBeNull()
  })

  it("deletes an account once both notices are sent and the schedule has passed, and sends the confirmation", async () => {
    const { supabase, queue } = buildSupabase({
      profiles: [{ id: "u1", email: "u1@example.com", full_name: "User One", email_opt_out_at: null }],
      invites: [{ user_id: "u1", campaign: "estagiorecife-2026", sent_at: isoDaysAgo(200) }],
      queue: [
        {
          user_id: "u1",
          campaign: "estagiorecife-2026",
          clock_started_at: isoDaysAgo(200),
          notice_30d_sent_at: isoDaysAgo(31),
          scheduled_deletion_at: isoDaysAgo(1),
          notice_1d_sent_at: isoDaysAgo(2)
        }
      ],
      getUserById: () => ({ last_sign_in_at: null })
    })
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(supabase)

    const report = await runRetention({ mode: "live", maxEmails: 100, maxDeletions: 25 })

    expect(deleteUserCompletely).toHaveBeenCalledWith("u1", { source: "retention_policy" })
    expect(sendRetentionDeletionConfirmation).toHaveBeenCalledWith(expect.objectContaining({ email: "u1@example.com" }))
    expect(report.deleted).toEqual(["u1"])
  })

  it("cancels the deletion and releases instead when the sign-in recheck finds a recent login", async () => {
    const { supabase, queue } = buildSupabase({
      profiles: [{ id: "u1", email: "u1@example.com", full_name: "User One", email_opt_out_at: null }],
      invites: [{ user_id: "u1", campaign: "estagiorecife-2026", sent_at: isoDaysAgo(200) }],
      queue: [
        {
          user_id: "u1",
          campaign: "estagiorecife-2026",
          clock_started_at: isoDaysAgo(200),
          notice_30d_sent_at: isoDaysAgo(31),
          scheduled_deletion_at: isoDaysAgo(1),
          notice_1d_sent_at: isoDaysAgo(2)
        }
      ],
      getUserById: () => ({ last_sign_in_at: new Date().toISOString() })
    })
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(supabase)

    const report = await runRetention({ mode: "live", maxEmails: 100, maxDeletions: 25 })

    expect(deleteUserCompletely).not.toHaveBeenCalled()
    expect(report.deleted).toEqual([])
    expect(report.released).toEqual(["u1"])
    expect(queue).toEqual([])
  })

  it("defers deletions and notices past their caps to the next run", async () => {
    const { supabase } = buildSupabase({
      profiles: [
        { id: "u1", email: "u1@example.com", full_name: "One", email_opt_out_at: null },
        { id: "u2", email: "u2@example.com", full_name: "Two", email_opt_out_at: null }
      ],
      invites: [
        { user_id: "u1", campaign: "estagiorecife-2026", sent_at: isoDaysAgo(60) },
        { user_id: "u2", campaign: "estagiorecife-2026", sent_at: isoDaysAgo(60) }
      ],
      queue: [
        {
          user_id: "u1",
          campaign: "estagiorecife-2026",
          clock_started_at: isoDaysAgo(60),
          notice_30d_sent_at: null,
          scheduled_deletion_at: null,
          notice_1d_sent_at: null
        },
        {
          user_id: "u2",
          campaign: "estagiorecife-2026",
          clock_started_at: isoDaysAgo(60),
          notice_30d_sent_at: null,
          scheduled_deletion_at: null,
          notice_1d_sent_at: null
        }
      ]
    })
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(supabase)

    const report = await runRetention({ mode: "live", maxEmails: 1, maxDeletions: 25 })

    expect(report.noticed30d).toHaveLength(1)
    expect(report.deferredToNextRun.emails).toBe(1)
  })

  it("uses createInviteToken with sentBy: null and resend: true so the link is always fresh", async () => {
    const { supabase } = buildSupabase({
      profiles: [{ id: "u1", email: "u1@example.com", full_name: "User One", email_opt_out_at: null }],
      invites: [{ user_id: "u1", campaign: "estagiorecife-2026", sent_at: isoDaysAgo(60) }],
      queue: [
        {
          user_id: "u1",
          campaign: "estagiorecife-2026",
          clock_started_at: isoDaysAgo(60),
          notice_30d_sent_at: null,
          scheduled_deletion_at: null,
          notice_1d_sent_at: null
        }
      ]
    })
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(supabase)

    await runRetention({ mode: "live", maxEmails: 100, maxDeletions: 25 })

    expect(createInviteToken).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", sentBy: null, resend: true })
    )
  })
})
