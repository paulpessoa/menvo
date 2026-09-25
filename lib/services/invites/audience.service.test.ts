/**
 * @jest-environment node
 */
import { resolveAudience } from "./audience.service"
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

  function buildSupabase(overrides: { invites?: any[]; suppressions?: any[]; listUsers?: any } = {}) {
    const listUsers = overrides.listUsers ?? jest.fn().mockResolvedValue({ data: { users: [] }, error: null })

    return {
      from: jest.fn((table: string) => {
        if (table === "profiles") {
          // Mirrors the real supabase-js query builder: thenable on its
          // own (no filter applied) *and* chainable via .in()/.eq().
          const buildQuery = () => {
            const query: any = Promise.resolve({ data: profiles, error: null })
            query.in = jest.fn().mockResolvedValue({ data: profiles, error: null })
            query.eq = jest.fn().mockResolvedValue({ data: profiles, error: null })
            return query
          }
          return { select: jest.fn().mockImplementation(buildQuery) }
        }
        if (table === "reengagement_invites") {
          return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: overrides.invites ?? [] }) }) }
        }
        if (table === "email_suppressions") {
          return { select: jest.fn().mockResolvedValue({ data: overrides.suppressions ?? [] }) }
        }
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
})
