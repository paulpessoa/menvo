/**
 * Camada 3 · Entity (organizações)
 * Regra: o que o negócio entende de uma organização e dos seus membros,
 * derivado da Row gerada (camada 2) para manter o elo com o banco.
 * TypeScript puro: sem Supabase, React ou Next.
 * Não faz: validar dado externo (camada 4) nem acessar o banco (camada 5).
 * Tradeoff: as colunas `status`, `role` e `join_policy` são `text` com CHECK no
 * banco, então o tipo gerado é `string`. Aqui elas são estreitadas para uniões
 * literais; quem garante o valor é o CHECK da migration e o schema Zod na
 * borda. "Mentor ou beneficiário" nunca é coluna: deriva de `user_roles`
 * (docs/domains/organizations.md §6, Q1). snake_case mantido no que vem da Row.
 */
import type { Tables } from "@/lib/types/supabase"

type OrganizationRow = Tables<"organizations">

export type MembershipStatus = "invited" | "requested" | "active"
export type OrgMemberRole = "admin" | "member"
export type PlatformRole = "mentor" | "mentee"
export type JoinPolicy = "open" | "invite_only"
export type OrgStatus = "active" | "suspended"
export type OrgPeriod = "all" | "30d" | "90d" | "1y"

/** A organização como a UI a vê (sem os contatos internos de `contact_*`). */
export type Organization = Pick<OrganizationRow, "id" | "slug" | "name" | "type" | "created_at"> & {
  status: OrgStatus
  join_policy: JoinPolicy
}

/** Um membro no dashboard do admin da org, com o papel derivado e as contagens. */
export interface OrgDashboardMember {
  userId: string
  role: OrgMemberRole
  status: MembershipStatus
  /** Derivado de user_roles - nunca um campo de membership (roadmap §6, Q1). */
  platformRole: PlatformRole | null
  joinedAt: string
  fullName: string | null
  email: string | null
  /** Sessões agendadas como beneficiário (match por mentee_id). */
  sessionsBooked: number
  /** Sessões dadas como mentor da org (match por mentor_id). */
  sessionsGiven: number
  quizDone: boolean
}

export interface OrgDashboardImpact {
  period: OrgPeriod
  totalSessionsCompleted: number
  totalHoursCompleted: number
  totalDiagnosticsDone: number
  averageRating: number | null
}

export interface OrgDashboardSummary {
  beneficiaries: number
  mentors: number
  pendingRequests: number
  pendingInvites: number
  sessionsBookedByBeneficiaries: number
  sessionsGivenByOrgMentors: number
  impact: OrgDashboardImpact
}

const DAY_MS = 24 * 60 * 60 * 1000
const PERIOD_DAYS: Record<Exclude<OrgPeriod, "all">, number> = { "30d": 30, "90d": 90, "1y": 365 }

/**
 * Papel da pessoa na plataforma a partir dos nomes de `user_roles`. Mentor
 * ganha de mentorado (quem é os dois conta como mentor da org); quem não tem
 * nenhum dos dois (ex.: só admin) volta `null`.
 */
export function derivePlatformRole(roleNames: readonly (string | null | undefined)[]): PlatformRole | null {
  if (roleNames.includes("mentor")) return "mentor"
  if (roleNames.includes("mentee")) return "mentee"
  return null
}

/** Início da janela do relatório de impacto em ISO, ou `null` para "todo o período". */
export function periodStart(period: OrgPeriod, now: Date = new Date()): string | null {
  if (period === "all") return null
  return new Date(now.getTime() - PERIOD_DAYS[period] * DAY_MS).toISOString()
}

/** Só admin com status `active` administra a org (o mesmo critério de `is_org_admin()` no SQL). */
export function isActiveAdmin(member: Pick<OrgDashboardMember, "role" | "status">): boolean {
  return member.role === "admin" && member.status === "active"
}

/** Uma sessão de um membro da org, só com o que o relatório de impacto usa. */
export interface OrgAppointment {
  id: string
  mentee_id: string
  mentor_id: string
  status: string
  /** `null` em sessões antigas; o relatório assume 45 min. */
  duration_minutes: number | null
  /** Notas de feedback (1-5) já sem os `null`. */
  ratings: number[]
}

const DEFAULT_SESSION_MINUTES = 45

/**
 * Impacto das sessões concluídas. Uma sessão entre dois membros da mesma org
 * aparece nas duas listas (como mentorado de um e mentor do outro) e conta
 * UMA vez (por id). Duração ausente vale 45 min; a nota média arredonda a 1
 * casa e é `null` sem nenhuma nota.
 */
export function computeSessionImpact(
  booked: readonly OrgAppointment[],
  given: readonly OrgAppointment[]
): Pick<OrgDashboardImpact, "totalSessionsCompleted" | "totalHoursCompleted" | "averageRating"> {
  const completed = new Map<string, OrgAppointment>()
  for (const appointment of [...booked, ...given]) {
    if (appointment.status === "completed" && appointment.id) completed.set(appointment.id, appointment)
  }

  const sessions = Array.from(completed.values())
  const minutes = sessions.reduce((sum, a) => sum + (a.duration_minutes || DEFAULT_SESSION_MINUTES), 0)
  const ratings = sessions.flatMap(a => a.ratings)

  return {
    totalSessionsCompleted: sessions.length,
    totalHoursCompleted: Number((minutes / 60).toFixed(1)),
    averageRating: ratings.length > 0 ? Number((ratings.reduce((a, r) => a + r, 0) / ratings.length).toFixed(1)) : null,
  }
}

/**
 * Cartões do topo do dashboard. Beneficiário é todo membro ativo que não é
 * mentor; sessões só contam membros ativos (convite pendente não soma).
 */
export function summarizeMembers(
  members: readonly OrgDashboardMember[],
  impact: OrgDashboardImpact
): OrgDashboardSummary {
  const active = members.filter(m => m.status === "active")
  return {
    beneficiaries: active.filter(m => m.platformRole !== "mentor").length,
    mentors: active.filter(m => m.platformRole === "mentor").length,
    pendingRequests: members.filter(m => m.status === "requested").length,
    pendingInvites: members.filter(m => m.status === "invited").length,
    sessionsBookedByBeneficiaries: active.reduce((sum, m) => sum + m.sessionsBooked, 0),
    sessionsGivenByOrgMentors: active.reduce((sum, m) => sum + m.sessionsGiven, 0),
    impact,
  }
}
