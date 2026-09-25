/**
 * @jest-environment node
 */
import { resolveAudience, fetchAllRows } from "./audience.service"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { hashEmail } from "@/lib/services/invites/suppression.service"

jest.mock("@/lib/utils/supabase/service-role", () => ({
  createServiceRoleClient: jest.fn(),
  ensureServerSide: jest.fn()
}))

describe("resolveAudience", () => {
  const profiles = [
    { id: "u1", email: "one@example.com", full_name: "One", email_opt_out_at: null },
    { id: "u2", email: "two@example.com", full_name: "Two", email_opt_out_at: null },
    { id: "u3", email: "three@example.com", full_name: "Three", email_opt_out_at: "2026-01-01" },
    { id: "u4", email: null, full_name: "Four", email_opt_out_at: null }
  ]

  function paged(rows: any[]) {
    // Mirrors the real supabase-js query builder: .order()/.in()/.eq()
    // are interchangeable and chainable in any order, terminated by
    // .range() the way resolveAudience calls it.
    const query: any = {}
    query.order = jest.fn().mockReturnValue(query)
    query.in = jest.fn().mockReturnValue(query)
    query.eq = jest.fn().mockReturnValue(query)
    query.range = jest.fn().mockImplementation((from: number, to: number) =>
      Promise.resolve({ data: rows.slice(from, to + 1), error: null })
    )
    return query
  }

  function buildSupabase(overrides: { invites?: any[]; suppressions?: any[]; listUsers?: any } = {}) {
    const listUsers = overrides.listUsers ?? jest.fn().mockResolvedValue({ data: { users: [] }, error: null })

    return {
      from: jest.fn((table: string) => {
        if (table === "profiles") return { select: jest.fn().mockReturnValue(paged(profiles)) }
        if (table === "reengagement_invites") return { select: jest.fn().mockReturnValue(paged(overrides.invites ?? [])) }
        if (table === "email_suppressions") return { select: jest.fn().mockReturnValue(paged(overrides.suppressions ?? [])) }
        throw new Error(`unexpected table ${table}`)
      }),
      auth: { admin: { listUsers } }
    }
  }

  it("returns everyone eligible when nothing is suppressed, opted out, or already invited", async () => {
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(buildSupabase())
    const result = await resolveAudience({ audience: "all", campaign: "c1" })

    expect(result.eligible.map(p => p.id)).toEqual(["u1", "u2"])
    expect(result.skipped).toEqual({ suppressed: 0, optedOut: 1, alreadyInvited: 0, noEmail: 1 })
  })

  it("excludes profiles already invited for this campaign unless resend is set", async () => {
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(
      buildSupabase({ invites: [{ user_id: "u1" }] })
    )
    const result = await resolveAudience({ audience: "all", campaign: "c1" })
    expect(result.eligible.map(p => p.id)).toEqual(["u2"])
    expect(result.skipped.alreadyInvited).toBe(1)
  })

  it("includes already-invited profiles when resend is true", async () => {
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(
      buildSupabase({ invites: [{ user_id: "u1" }] })
    )
    const result = await resolveAudience({ audience: "all", campaign: "c1", resend: true })
    expect(result.eligible.map(p => p.id)).toEqual(["u1", "u2"])
  })

  it("excludes suppressed e-mails without querying per-candidate", async () => {
    const supabase = buildSupabase({ suppressions: [{ email_hash: hashEmail("one@example.com") }] })
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(supabase)
    const result = await resolveAudience({ audience: "all", campaign: "c1" })
    expect(result.eligible.map(p => p.id)).toEqual(["u2"])
    expect(result.skipped.suppressed).toBe(1)
    // profiles, reengagement_invites, email_suppressions — three calls total, not one per candidate.
    expect(supabase.from).toHaveBeenCalledTimes(3)
  })

  it("returns nothing for an empty 'selected' audience", async () => {
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(buildSupabase())
    const result = await resolveAudience({ audience: "selected", campaign: "c1", userIds: [] })
    expect(result.eligible).toEqual([])
  })

  it("filters out anyone with a sign-in for the never_signed_in audience", async () => {
    const listUsers = jest.fn().mockResolvedValue({
      data: { users: [{ id: "u1", last_sign_in_at: "2026-01-01" }, { id: "u2", last_sign_in_at: null }] },
      error: null
    })
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(buildSupabase({ listUsers }))
    const result = await resolveAudience({ audience: "never_signed_in", campaign: "c1" })
    expect(result.eligible.map(p => p.id)).toEqual(["u2"])
  })

  it("reads a cohort larger than one PostgREST page (1000 rows) without silently truncating", async () => {
    const bigProfiles = Array.from({ length: 1200 }, (_, i) => ({
      id: `u${i}`,
      email: `u${i}@example.com`,
      full_name: null,
      email_opt_out_at: null
    }))
    const supabase = {
      from: jest.fn((table: string) => {
        if (table === "profiles") return { select: jest.fn().mockReturnValue(paged(bigProfiles)) }
        if (table === "reengagement_invites") return { select: jest.fn().mockReturnValue(paged([])) }
        if (table === "email_suppressions") return { select: jest.fn().mockReturnValue(paged([])) }
        throw new Error(`unexpected table ${table}`)
      }),
      auth: { admin: { listUsers: jest.fn() } }
    }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(supabase)

    const result = await resolveAudience({ audience: "jotform_not_invited", campaign: "c1" })
    expect(result.eligible).toHaveLength(1200)
  })
})

describe("fetchAllRows", () => {
  it("pages until a page comes back shorter than the page size", async () => {
    const page1 = Array.from({ length: 1000 }, (_, i) => i)
    const page2 = [1000, 1001]
    const buildPage = jest
      .fn()
      .mockResolvedValueOnce({ data: page1, error: null })
      .mockResolvedValueOnce({ data: page2, error: null })

    const rows = await fetchAllRows(buildPage)
    expect(rows).toHaveLength(1002)
    expect(buildPage).toHaveBeenCalledTimes(2)
    expect(buildPage).toHaveBeenNthCalledWith(1, 0, 999)
    expect(buildPage).toHaveBeenNthCalledWith(2, 1000, 1999)
  })

  it("throws on the first page error instead of returning a partial result", async () => {
    const buildPage = jest.fn().mockResolvedValue({ data: null, error: new Error("boom") })
    await expect(fetchAllRows(buildPage)).rejects.toThrow("boom")
  })
})
