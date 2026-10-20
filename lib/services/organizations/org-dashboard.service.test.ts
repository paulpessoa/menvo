import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, Tables } from "@/lib/types/supabase"
import type { OrgAppointment } from "@/lib/domain/organizations/organization.entity"
import type { OrganizationsRepository, OrgMemberRow } from "@/lib/repositories/organizations.repository"
import { buildOrgDashboard, getPlatformRole } from "./org-dashboard.service"

const ORG = { id: "org-1", name: "Giral", slug: "giral" } as Tables<"organizations">

function member(userId: string, role: "admin" | "member", status: OrgMemberRow["status"], n: number): OrgMemberRow {
  return {
    user_id: userId,
    role,
    status,
    created_at: `2026-01-0${n}`,
    profile: { id: userId, full_name: `Name ${userId}`, email: `${userId}@x.org` },
  }
}

function appt(over: Partial<OrgAppointment> & Pick<OrgAppointment, "id">): OrgAppointment {
  return { mentee_id: "-", mentor_id: "-", status: "completed", duration_minutes: 45, ratings: [], ...over }
}

/** Fake repository: only what the dashboard reads, with call capture. */
function fakeRepo(over: Partial<OrganizationsRepository> = {}) {
  const repo = {
    findById: jest.fn().mockResolvedValue(ORG),
    listMembers: jest.fn().mockResolvedValue([]),
    listAppointments: jest.fn().mockResolvedValue([]),
    listUserRoleNames: jest.fn().mockResolvedValue(new Map()),
    quizDoneEmails: jest.fn().mockResolvedValue([]),
    ...over,
  }
  return repo as unknown as OrganizationsRepository & typeof repo
}

describe("buildOrgDashboard", () => {
  /**
   * Regression fixture: these are the numbers the PREVIOUS implementation
   * (client-side counting, separate feedback query) produced for this exact
   * data, checked before the refactor. The overlap a7 (u3 mentee / u2 mentor)
   * must count once; the invited and cancelled sessions must not move the
   * completed totals; ratings come only from completed sessions.
   */
  function goldenRepo() {
    const members = [
      member("u1", "admin", "active", 1),
      member("u2", "member", "active", 2),
      member("u3", "member", "active", 3),
      member("u4", "member", "invited", 4),
      member("u5", "member", "requested", 5),
    ]
    const booked = [
      appt({ id: "a1", mentee_id: "u1", ratings: [5] }),
      appt({ id: "a2", mentee_id: "u3", duration_minutes: null }),
      appt({ id: "a3", mentee_id: "u3", status: "cancelled", duration_minutes: 30, ratings: [1] }),
      appt({ id: "a4", mentee_id: "u4", duration_minutes: 60 }),
      appt({ id: "a7", mentee_id: "u3", mentor_id: "u2", duration_minutes: 30, ratings: [3] }),
    ]
    const given = [
      appt({ id: "a5", mentor_id: "u2", duration_minutes: 60, ratings: [4] }),
      appt({ id: "a6", mentor_id: "u5", status: "pending" }),
      appt({ id: "a7", mentee_id: "u3", mentor_id: "u2", duration_minutes: 30, ratings: [3] }),
    ]
    const roles = new Map([
      ["u1", ["mentee"]],
      ["u2", ["mentee", "mentor"]],
      ["u3", ["mentee"]],
      ["u5", ["mentor"]],
    ])
    return fakeRepo({
      listMembers: jest.fn().mockResolvedValue(members),
      listAppointments: jest.fn().mockImplementation((_ids, as) => Promise.resolve(as === "mentee" ? booked : given)),
      listUserRoleNames: jest.fn().mockResolvedValue(roles),
      quizDoneEmails: jest.fn().mockResolvedValue(["u1@x.org", "u3@x.org"]),
    })
  }

  it("matches the numbers the previous implementation produced for the same data", async () => {
    const res = await buildOrgDashboard(goldenRepo(), "org-1", "all")

    expect(res?.summary).toEqual({
      beneficiaries: 2,
      mentors: 1,
      pendingRequests: 1,
      pendingInvites: 1,
      sessionsBookedByBeneficiaries: 4,
      sessionsGivenByOrgMentors: 2,
      impact: {
        period: "all",
        totalSessionsCompleted: 5,
        totalHoursCompleted: 4,
        totalDiagnosticsDone: 2,
        averageRating: 4,
      },
    })
    expect(res?.members.map(m => [m.userId, m.platformRole, m.sessionsBooked, m.sessionsGiven, m.quizDone])).toEqual([
      ["u1", "mentee", 1, 0, true],
      ["u2", "mentor", 0, 2, false],
      ["u3", "mentee", 3, 0, true],
      ["u4", null, 1, 0, false],
      ["u5", "mentor", 0, 1, false],
    ])
    expect(res?.organization).toBe(ORG)
  })

  it("maps member rows to the dashboard shape (profile columns, joinedAt)", async () => {
    const repo = fakeRepo({ listMembers: jest.fn().mockResolvedValue([member("u1", "admin", "active", 1)]) })
    const res = await buildOrgDashboard(repo, "org-1")
    expect(res?.members[0]).toMatchObject({
      userId: "u1",
      role: "admin",
      status: "active",
      joinedAt: "2026-01-01",
      fullName: "Name u1",
      email: "u1@x.org",
    })
  })

  it("passes the period window to both appointment queries (30d)", async () => {
    const repo = fakeRepo({ listMembers: jest.fn().mockResolvedValue([member("u1", "admin", "active", 1)]) })
    const now = new Date("2026-10-19T12:00:00.000Z")
    const res = await buildOrgDashboard(repo, "org-1", "30d", now)

    expect(res?.summary.impact.period).toBe("30d")
    expect(repo.listAppointments).toHaveBeenCalledWith(["u1"], "mentee", "2026-09-19T12:00:00.000Z")
    expect(repo.listAppointments).toHaveBeenCalledWith(["u1"], "mentor", "2026-09-19T12:00:00.000Z")
  })

  it("has no time filter for the whole period", async () => {
    const repo = fakeRepo({ listMembers: jest.fn().mockResolvedValue([member("u1", "admin", "active", 1)]) })
    await buildOrgDashboard(repo, "org-1", "all")
    expect(repo.listAppointments).toHaveBeenCalledWith(["u1"], "mentee", null)
  })

  it("returns null when the org does not exist and reads nothing else", async () => {
    const repo = fakeRepo({ findById: jest.fn().mockResolvedValue(null) })
    expect(await buildOrgDashboard(repo, "nope")).toBeNull()
    expect(repo.listMembers).not.toHaveBeenCalled()
  })

  it("handles an org with no members (zeros, null rating)", async () => {
    const res = await buildOrgDashboard(fakeRepo(), "org-1")
    expect(res?.members).toEqual([])
    expect(res?.summary).toMatchObject({
      beneficiaries: 0,
      mentors: 0,
      impact: { totalSessionsCompleted: 0, totalHoursCompleted: 0, totalDiagnosticsDone: 0, averageRating: null },
    })
  })

  it("skips the quiz RPC when no member has an e-mail", async () => {
    const noEmail: OrgMemberRow = { ...member("u1", "admin", "active", 1), profile: null }
    const repo = fakeRepo({ listMembers: jest.fn().mockResolvedValue([noEmail]) })
    const res = await buildOrgDashboard(repo, "org-1")
    expect(repo.quizDoneEmails).not.toHaveBeenCalled()
    expect(res?.members[0]).toMatchObject({ fullName: null, email: null, quizDone: false })
  })
})

describe("getPlatformRole", () => {
  function clientWithRoles(result: { data: unknown; error: unknown }) {
    const chain = { select: jest.fn().mockReturnThis(), in: jest.fn().mockResolvedValue(result) }
    return { from: jest.fn(() => chain) } as unknown as SupabaseClient<Database>
  }

  it("resolves mentor over mentee", async () => {
    const client = clientWithRoles({
      data: [
        { user_id: "u2", roles: { name: "mentee" } },
        { user_id: "u2", roles: { name: "mentor" } },
      ],
      error: null,
    })
    expect(await getPlatformRole(client, "u2")).toBe("mentor")
  })

  it("is null when the person has neither role", async () => {
    expect(await getPlatformRole(clientWithRoles({ data: [], error: null }), "u9")).toBeNull()
  })

  it("is null (not an exception) when the lookup fails", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {})
    expect(await getPlatformRole(clientWithRoles({ data: null, error: { message: "boom" } }), "u2")).toBeNull()
    jest.restoreAllMocks()
  })
})
