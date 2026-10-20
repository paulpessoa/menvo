import {
  derivePlatformRole,
  isActiveAdmin,
  periodStart,
  summarizeMembers,
  type OrgDashboardImpact,
  type OrgDashboardMember,
} from "./organization.entity"

function member(over: Partial<OrgDashboardMember>): OrgDashboardMember {
  return {
    userId: "u",
    role: "member",
    status: "active",
    platformRole: "mentee",
    joinedAt: "2026-01-01",
    fullName: null,
    email: null,
    sessionsBooked: 0,
    sessionsGiven: 0,
    quizDone: false,
    ...over,
  }
}

const impact: OrgDashboardImpact = {
  period: "all",
  totalSessionsCompleted: 0,
  totalHoursCompleted: 0,
  totalDiagnosticsDone: 0,
  averageRating: null,
}

describe("derivePlatformRole", () => {
  it("mentor wins over mentee", () => {
    expect(derivePlatformRole(["mentee", "mentor"])).toBe("mentor")
  })
  it("falls back to mentee, then null", () => {
    expect(derivePlatformRole(["mentee", "admin"])).toBe("mentee")
    expect(derivePlatformRole(["admin", null, undefined])).toBeNull()
    expect(derivePlatformRole([])).toBeNull()
  })
})

describe("periodStart", () => {
  const now = new Date("2026-10-19T12:00:00.000Z")
  it("is null for the whole period", () => {
    expect(periodStart("all", now)).toBeNull()
  })
  it.each([
    ["30d", "2026-09-19T12:00:00.000Z"],
    ["90d", "2026-07-21T12:00:00.000Z"],
    ["1y", "2025-10-19T12:00:00.000Z"],
  ] as const)("%s goes back the right number of days", (period, expected) => {
    expect(periodStart(period, now)).toBe(expected)
  })
})

describe("isActiveAdmin", () => {
  it("requires role admin AND status active", () => {
    expect(isActiveAdmin({ role: "admin", status: "active" })).toBe(true)
    expect(isActiveAdmin({ role: "admin", status: "invited" })).toBe(false)
    expect(isActiveAdmin({ role: "member", status: "active" })).toBe(false)
  })
})

describe("summarizeMembers", () => {
  it("splits beneficiaries and mentors among ACTIVE members and counts pending apart", () => {
    const members = [
      member({ userId: "a", sessionsBooked: 2 }),
      member({ userId: "b", platformRole: null, sessionsBooked: 1 }),
      member({ userId: "c", platformRole: "mentor", sessionsGiven: 4 }),
      member({ userId: "d", platformRole: "mentor", status: "invited", sessionsGiven: 9 }),
      member({ userId: "e", status: "requested", sessionsBooked: 7 }),
    ]
    const summary = summarizeMembers(members, impact)
    expect(summary).toMatchObject({
      beneficiaries: 2,
      mentors: 1,
      pendingRequests: 1,
      pendingInvites: 1,
      // sessions of non-active members never count
      sessionsBookedByBeneficiaries: 3,
      sessionsGivenByOrgMentors: 4,
    })
    expect(summary.impact).toBe(impact)
  })
})
