import type { SupabaseClient } from "@supabase/supabase-js"

export interface OrgDashboardMember {
  userId: string
  role: "admin" | "member"
  status: "invited" | "requested" | "active"
  /** Derived from user_roles — never a separate membership field (roadmap §6, Q1). */
  platformRole: "mentor" | "mentee" | null
  joinedAt: string
  fullName: string | null
  email: string | null
  /** Sessions booked as a beneficiary (mentee_id match). */
  sessionsBooked: number
  /** Sessions given as an org mentor (mentor_id match). */
  sessionsGiven: number
  quizDone: boolean
}

export interface OrgDashboardSummary {
  beneficiaries: number
  mentors: number
  pendingRequests: number
  pendingInvites: number
  sessionsBookedByBeneficiaries: number
  sessionsGivenByOrgMentors: number
}

export interface OrgDashboard {
  organization: Record<string, unknown>
  members: OrgDashboardMember[]
  summary: OrgDashboardSummary
}

/**
 * Everything `/dashboard/org` needs: org info, its members with their
 * derived platform role (mentor/mentee — never a separate field, see
 * roadmap §6 Q1) and per-role stats, and aggregate counts. Pulled out of
 * the route handler so it's a plain function other callers (MCP tools,
 * an eventual assistant) can reuse without going through HTTP.
 */
export async function getOrgDashboard(
  supabase: SupabaseClient,
  organizationId: string
): Promise<OrgDashboard | null> {
  const { data: organization, error: orgError } = await supabase
    .from("organizations" as any)
    .select("*")
    .eq("id", organizationId)
    .maybeSingle()

  if (orgError) throw orgError
  if (!organization) return null

  const { data: members, error: membersError } = await supabase
    .from("organization_members" as any)
    .select("user_id, role, status, created_at, profiles(id, full_name, email)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })

  if (membersError) throw membersError

  const memberRows = (members ?? []) as any[]
  const memberIds = memberRows.map(m => m.user_id)
  const memberEmails = memberRows
    .map(m => m.profiles?.email)
    .filter((email): email is string => Boolean(email))

  const [{ data: bookedAppointments }, { data: givenAppointments }, { data: quizzes }, { data: roleRows }] = await Promise.all([
    memberIds.length
      ? supabase.from("appointments").select("mentee_id").in("mentee_id", memberIds)
      : Promise.resolve({ data: [] as { mentee_id: string }[] }),
    memberIds.length
      ? supabase.from("appointments").select("mentor_id").in("mentor_id", memberIds)
      : Promise.resolve({ data: [] as { mentor_id: string }[] }),
    memberEmails.length
      ? supabase
          .from("quiz_responses" as any)
          .select("email")
          .in("email", memberEmails)
      : Promise.resolve({ data: [] as { email: string }[] }),
    memberIds.length
      ? supabase
          .from("user_roles")
          .select("user_id, roles(name)")
          .in("user_id", memberIds)
      : Promise.resolve({ data: [] as { user_id: string; roles: { name: string } | null }[] })
  ])

  const bookedByMentee = new Map<string, number>()
  for (const appt of (bookedAppointments ?? []) as { mentee_id: string }[]) {
    bookedByMentee.set(appt.mentee_id, (bookedByMentee.get(appt.mentee_id) ?? 0) + 1)
  }
  const givenByMentor = new Map<string, number>()
  for (const appt of (givenAppointments ?? []) as { mentor_id: string }[]) {
    givenByMentor.set(appt.mentor_id, (givenByMentor.get(appt.mentor_id) ?? 0) + 1)
  }
  const quizEmailSet = new Set(((quizzes ?? []) as { email: string }[]).map(q => q.email))

  const platformRoleByUser = new Map<string, "mentor" | "mentee">()
  for (const row of (roleRows ?? []) as { user_id: string; roles: { name: string } | null }[]) {
    const name = row.roles?.name
    if (name !== "mentor" && name !== "mentee") continue
    // A person can hold both roles historically; mentor wins for display,
    // matching how the platform treats mentor as the "upgraded" role.
    if (name === "mentor" || !platformRoleByUser.has(row.user_id)) {
      platformRoleByUser.set(row.user_id, name)
    }
  }

  const members_: OrgDashboardMember[] = memberRows.map(m => ({
    userId: m.user_id,
    role: m.role,
    status: m.status,
    platformRole: platformRoleByUser.get(m.user_id) ?? null,
    joinedAt: m.created_at,
    fullName: m.profiles?.full_name ?? null,
    email: m.profiles?.email ?? null,
    sessionsBooked: bookedByMentee.get(m.user_id) ?? 0,
    sessionsGiven: givenByMentor.get(m.user_id) ?? 0,
    quizDone: m.profiles?.email ? quizEmailSet.has(m.profiles.email) : false
  }))

  const activeMembers = members_.filter(m => m.status === "active")
  const summary: OrgDashboardSummary = {
    beneficiaries: activeMembers.filter(m => m.platformRole !== "mentor").length,
    mentors: activeMembers.filter(m => m.platformRole === "mentor").length,
    pendingRequests: members_.filter(m => m.status === "requested").length,
    pendingInvites: members_.filter(m => m.status === "invited").length,
    sessionsBookedByBeneficiaries: activeMembers.reduce((sum, m) => sum + m.sessionsBooked, 0),
    sessionsGivenByOrgMentors: activeMembers.reduce((sum, m) => sum + m.sessionsGiven, 0)
  }

  return { organization, members: members_, summary }
}

/** Single-user version of the platformRole derivation above, for callers
 * (e.g. the invite email) that only need one person's role. */
export async function getPlatformRole(
  supabase: SupabaseClient,
  userId: string
): Promise<"mentor" | "mentee" | null> {
  const { data } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId)
    .returns<{ roles: { name: string } | null }[]>()

  const names = (data ?? []).map(r => r.roles?.name)
  if (names.includes("mentor")) return "mentor"
  if (names.includes("mentee")) return "mentee"
  return null
}
