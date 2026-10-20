import {
  inviteMemberSchema,
  joinOrganizationSchema,
  leaveOrganizationQuerySchema,
  membershipResultSchema,
  memberUserIdSchema,
  myMembershipSchema,
  orgDashboardSchema,
  orgEnvelope,
  orgIdParamSchema,
  orgPathParamsSchema,
  orgPeriodQuerySchema,
  orgPeriodSchema,
  updateOrgSettingsSchema
} from "./organizations"

const UUID = "33333333-3333-4333-8333-333333333333"

describe("org input schemas", () => {
  it("orgIdParamSchema rejects ids that are not UUIDs", () => {
    expect(orgIdParamSchema.safeParse(UUID).success).toBe(true)
    expect(orgIdParamSchema.safeParse("not-a-uuid").success).toBe(false)
  })

  it("orgPeriodSchema keeps known values and falls back to all", () => {
    expect(orgPeriodSchema.parse("30d")).toBe("30d")
    expect(orgPeriodSchema.parse("1y")).toBe("1y")
    expect(orgPeriodSchema.parse("forever")).toBe("all")
    expect(orgPeriodSchema.parse(null)).toBe("all")
  })

  it("inviteMemberSchema trims and lowercases the e-mail", () => {
    expect(inviteMemberSchema.parse({ email: "  Ana@Giral.ORG " }).email).toBe("ana@giral.org")
    expect(inviteMemberSchema.safeParse({ email: "sem-arroba" }).success).toBe(false)
  })

  it("memberUserIdSchema and leaveOrganizationQuerySchema require UUIDs", () => {
    expect(memberUserIdSchema.safeParse({ userId: UUID }).success).toBe(true)
    expect(memberUserIdSchema.safeParse({ userId: "x" }).success).toBe(false)
    expect(leaveOrganizationQuerySchema.safeParse({ organizationId: UUID }).success).toBe(true)
    expect(leaveOrganizationQuerySchema.safeParse({}).success).toBe(false)
  })

  it("updateOrgSettingsSchema only accepts the two join policies", () => {
    expect(updateOrgSettingsSchema.safeParse({ join_policy: "invite_only" }).success).toBe(true)
    expect(updateOrgSettingsSchema.safeParse({ join_policy: "closed" }).success).toBe(false)
  })

  it("joinOrganizationSchema trims the slug and rejects an empty one", () => {
    expect(joinOrganizationSchema.parse({ slug: " giral " }).slug).toBe("giral")
    expect(joinOrganizationSchema.safeParse({ slug: "   " }).success).toBe(false)
  })
})

describe("org contract helpers", () => {
  it("orgEnvelope wraps data with an optional message, like successResponse", () => {
    const schema = orgEnvelope(membershipResultSchema)
    expect(schema.safeParse({ data: { status: "invited" }, message: "Convite enviado" }).success).toBe(true)
    expect(schema.safeParse({ data: { status: "invited" } }).success).toBe(true)
    expect(schema.safeParse({ data: { status: "banned" } }).success).toBe(false)
    expect(schema.safeParse({ status: "invited" }).success).toBe(false)
  })

  it("orgPathParamsSchema requires a UUID id and orgPeriodQuerySchema lists only valid periods", () => {
    expect(orgPathParamsSchema.safeParse({ id: UUID }).success).toBe(true)
    expect(orgPathParamsSchema.safeParse({ id: "x" }).success).toBe(false)
    expect(orgPeriodQuerySchema.safeParse({}).success).toBe(true)
    expect(orgPeriodQuerySchema.safeParse({ period: "forever" }).success).toBe(false)
  })
})

describe("org output schemas", () => {
  const member = {
    userId: UUID,
    role: "member",
    status: "active",
    platformRole: "mentor",
    joinedAt: "2026-01-01",
    fullName: null,
    email: "a@b.co",
    sessionsBooked: 0,
    sessionsGiven: 2,
    quizDone: false
  }
  const summary = {
    beneficiaries: 0,
    mentors: 1,
    pendingRequests: 0,
    pendingInvites: 0,
    sessionsBookedByBeneficiaries: 0,
    sessionsGivenByOrgMentors: 2,
    impact: { period: "all", totalSessionsCompleted: 2, totalHoursCompleted: 1.5, totalDiagnosticsDone: 0, averageRating: null }
  }

  it("orgDashboardSchema accepts the dashboard and keeps extra organization columns", () => {
    const parsed = orgDashboardSchema.parse({
      organization: { id: UUID, slug: "giral", name: "Giral", join_policy: "open", contact_email: "x@y.z" },
      members: [member],
      summary
    })
    expect(parsed.organization).toHaveProperty("contact_email", "x@y.z")
  })

  it("orgDashboardSchema rejects a malformed member", () => {
    const bad = orgDashboardSchema.safeParse({
      organization: { id: UUID, slug: "g", name: "G" },
      members: [{ ...member, status: "banned" }],
      summary
    })
    expect(bad.success).toBe(false)
  })

  it("myMembershipSchema allows a null organization", () => {
    const row = { organization_id: UUID, role: "member", status: "invited", created_at: "2026-01-01", organizations: null }
    expect(myMembershipSchema.safeParse(row).success).toBe(true)
  })
})
