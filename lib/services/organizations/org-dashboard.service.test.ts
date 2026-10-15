import { getOrgDashboard, getPlatformRole } from "./org-dashboard.service"

describe("org-dashboard service", () => {
  function createFakeSupabase(overrides?: {
    org?: any
    members?: any[]
    booked?: any[]
    given?: any[]
    feedbacks?: any[]
    roles?: any[]
  }) {
    const org = overrides?.org !== undefined ? overrides.org : { id: "org-1", name: "Giral", slug: "giral" }
    const members = overrides?.members ?? [
      { user_id: "u1", role: "admin", status: "active", created_at: "2026-01-01", profiles: { id: "u1", full_name: "Admin User", email: "admin@giral.org" } },
      { user_id: "u2", role: "member", status: "active", created_at: "2026-02-01", profiles: { id: "u2", full_name: "Mentor User", email: "mentor@giral.org" } },
    ]
    const booked = overrides?.booked ?? [
      { id: "a1", mentee_id: "u1", status: "completed", duration_minutes: 45, scheduled_at: "2026-10-01" },
    ]
    const given = overrides?.given ?? [
      { id: "a2", mentor_id: "u2", status: "completed", duration_minutes: 60, scheduled_at: "2026-10-05" },
    ]
    const feedbacks = overrides?.feedbacks ?? [{ rating: 5 }, { rating: 4 }]
    const roles = overrides?.roles ?? [{ user_id: "u2", roles: { name: "mentor" } }]

    const gteMock = jest.fn().mockReturnThis()
    const inMock = jest.fn().mockImplementation(() => ({
      gte: gteMock,
      then: (resolve: any) => Promise.resolve({ data: booked }).then(resolve),
    }))

    const client: any = {
      from: jest.fn((table: string) => {
        if (table === "organizations") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: org, error: null }),
          }
        }
        if (table === "organization_members") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: members, error: null }),
          }
        }
        if (table === "appointments") {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn((col: string) => {
              const list = col === "mentee_id" ? booked : given
              const obj: any = {
                gte: jest.fn().mockImplementation(() => obj),
                then: (resolve: any) => Promise.resolve({ data: list }).then(resolve),
              }
              return obj
            }),
          }
        }
        if (table === "appointment_feedbacks") {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            not: jest.fn().mockResolvedValue({ data: feedbacks, error: null }),
          }
        }
        if (table === "user_roles") {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({ data: roles, error: null }),
            eq: jest.fn().mockReturnThis(),
            returns: jest.fn().mockResolvedValue({ data: roles }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
        }
      }),
      rpc: jest.fn().mockResolvedValue({ data: [{ email: "admin@giral.org" }] }),
    }

    return { client }
  }

  it("calculates summary impact metrics for organization dashboard", async () => {
    const { client } = createFakeSupabase()
    const res = await getOrgDashboard(client, "org-1", "all")

    expect(res).not.toBeNull()
    expect(res?.organization).toEqual({ id: "org-1", name: "Giral", slug: "giral" })
    expect(res?.summary.impact.period).toBe("all")
    expect(res?.summary.impact.totalSessionsCompleted).toBe(2)
    // 45 + 60 = 105 min = 1.8h
    expect(res?.summary.impact.totalHoursCompleted).toBe(1.8)
    expect(res?.summary.impact.averageRating).toBe(4.5)
    expect(res?.summary.impact.totalDiagnosticsDone).toBe(1)
  })

  it("filters by period (30d)", async () => {
    const { client } = createFakeSupabase()
    const res = await getOrgDashboard(client, "org-1", "30d")

    expect(res?.summary.impact.period).toBe("30d")
  })

  it("resolves platform roles correctly in getPlatformRole", async () => {
    const { client } = createFakeSupabase({ roles: [{ user_id: "u2", roles: { name: "mentor" } }] })
    const role = await getPlatformRole(client, "u2")
    expect(role).toBe("mentor")
  })
})
