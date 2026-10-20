/**
 * Camada 7 · Service (dashboard da organização)
 * Regra: monta o que `/dashboard/org` mostra (org, membros com papel derivado,
 * resumo e impacto) a partir do repository. A regra de contagem mora na entity
 * (funções puras); aqui só se orquestra a leitura.
 * Não faz: HTTP, autorização (o guard da rota confere o admin; a RLS e as RPCs
 * `security definer` são a última barreira) nem SQL.
 * Tradeoff: `getOrgDashboard(client, …)` mantém a assinatura antiga para os
 * chamadores não mudarem; `buildOrgDashboard(repo, …)` é a que se testa com um
 * repository falso.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, Tables } from "@/lib/types/supabase"
import {
  computeSessionImpact,
  derivePlatformRole,
  periodStart,
  summarizeMembers,
  type OrgDashboardMember,
  type OrgDashboardSummary,
  type OrgPeriod,
  type PlatformRole,
} from "@/lib/domain/organizations/organization.entity"
import {
  createOrganizationsRepository,
  type OrganizationsRepository,
} from "@/lib/repositories/organizations.repository"

export interface OrgDashboard {
  organization: Tables<"organizations">
  members: OrgDashboardMember[]
  summary: OrgDashboardSummary
}

function countBy<T>(items: readonly T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1)
  return counts
}

/**
 * Everything `/dashboard/org` needs: org info, its members with their
 * derived platform role (mentor/mentee - never a separate field, see
 * roadmap §6 Q1) and per-role stats, and aggregate counts. A plain function
 * other callers (MCP tools, an eventual assistant) can reuse without HTTP.
 *
 * Returns `null` when the org does not exist (or RLS hides it).
 */
export async function buildOrgDashboard(
  repo: OrganizationsRepository,
  organizationId: string,
  period: OrgPeriod = "all",
  now: Date = new Date()
): Promise<OrgDashboard | null> {
  const organization = await repo.findById(organizationId)
  if (!organization) return null

  const memberRows = await repo.listMembers(organizationId)
  const memberIds = memberRows.map(m => m.user_id)
  const hasMemberEmails = memberRows.some(m => Boolean(m.profile?.email))
  const since = periodStart(period, now)

  const [bookedList, givenList, quizEmails, roleNames] = await Promise.all([
    repo.listAppointments(memberIds, "mentee", since),
    repo.listAppointments(memberIds, "mentor", since),
    // quiz_responses has no direct-select policy any more (RLS audit,
    // STATUS.md 2026-09-23) - org admins see "did the quiz?" only through
    // this security-definer RPC, which checks is_org_admin() itself and
    // never exposes another member's raw quiz answers.
    hasMemberEmails ? repo.quizDoneEmails(organizationId) : Promise.resolve([] as string[]),
    repo.listUserRoleNames(memberIds),
  ])

  const bookedByMentee = countBy(bookedList, a => a.mentee_id)
  const givenByMentor = countBy(givenList, a => a.mentor_id)
  const quizEmailSet = new Set(quizEmails)

  const members: OrgDashboardMember[] = memberRows.map(m => ({
    userId: m.user_id,
    role: m.role,
    status: m.status,
    platformRole: derivePlatformRole(roleNames.get(m.user_id) ?? []),
    joinedAt: m.created_at,
    fullName: m.profile?.full_name ?? null,
    email: m.profile?.email ?? null,
    sessionsBooked: bookedByMentee.get(m.user_id) ?? 0,
    sessionsGiven: givenByMentor.get(m.user_id) ?? 0,
    quizDone: m.profile?.email ? quizEmailSet.has(m.profile.email) : false,
  }))

  const summary = summarizeMembers(members, {
    period,
    ...computeSessionImpact(bookedList, givenList),
    totalDiagnosticsDone: members.filter(m => m.quizDone).length,
  })

  return { organization, members, summary }
}

/** `buildOrgDashboard` com o repository criado a partir do client do usuário (RLS). */
export function getOrgDashboard(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  period: OrgPeriod = "all"
): Promise<OrgDashboard | null> {
  return buildOrgDashboard(createOrganizationsRepository(supabase), organizationId, period)
}

/**
 * Single-user version of the platformRole derivation above, for callers
 * (e.g. the invite email) that only need one person's role. A failed lookup
 * returns `null` instead of throwing: the role only picks the e-mail copy, and
 * it must not fail an invite or a join request that already succeeded.
 */
export async function getPlatformRole(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<PlatformRole | null> {
  try {
    const roleNames = await createOrganizationsRepository(supabase).listUserRoleNames([userId])
    return derivePlatformRole(roleNames.get(userId) ?? [])
  } catch (error) {
    console.warn("[org-dashboard.getPlatformRole]", error instanceof Error ? error.message : error)
    return null
  }
}
