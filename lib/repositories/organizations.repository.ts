/**
 * Camada 5 · Repository (organizações)
 * Regra: único ponto que fala com o banco para `organizations` e
 * `organization_members`, mais as leituras dos membros que o dashboard da org
 * precisa (sessões, papéis, RPC do quiz). Recebe o client por parâmetro: o do
 * usuário, com RLS.
 * Não faz: regra de negócio (camada 7), criar client (impede teste e esconde
 * qual permissão está em uso) nem usar `service_role` (o acesso privilegiado
 * da org, quando entrar, fica num port, não aqui).
 * Tradeoff: uma interface a mais em troca de testar o service com um fake e de
 * não deixar `from("organization_members")` espalhado por rotas. Os métodos
 * entram conforme cada camada acima passa a usá-los, para não haver código
 * sem chamador. Erro do driver vira `RepositoryError`; quem prefere degradar
 * (a página pública, por exemplo) captura no service.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, Tables } from "@/lib/types/supabase"
import type {
  JoinPolicy,
  MembershipStatus,
  OrgAppointment,
  OrgMemberRole,
} from "@/lib/domain/organizations/organization.entity"
import { RepositoryError } from "./repository-error"

/**
 * Quantos ids vão num filtro `in (...)`. O PostgREST recebe o filtro na URL
 * (~8 KB de limite); com UUIDs de 36 caracteres, 100 ids ficam em ~3,7 KB e
 * uma org grande não derruba a consulta. Acima disso, várias chamadas.
 */
const IN_CHUNK = 100

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/** O que a página pública `/o/[slug]` precisa de uma org ativa. */
export interface PublicOrganization {
  slug: string
  name: string
  type: string
  join_policy: JoinPolicy
}

/** Uma org aberta a que um mentor pertence (chip "Mentor da {org}"). */
export interface MentorOrganizationLink {
  user_id: string
  name: string
  slug: string
}

/** Linha de membro com o perfil já embutido (uma consulta, sem N+1). */
export interface OrgMemberRow {
  user_id: string
  role: OrgMemberRole
  status: MembershipStatus
  created_at: string
  profile: { id: string; full_name: string | null; email: string | null } | null
}

/** Uma org que a pessoa administra (o seletor de `/dashboard/org`). */
export interface AdminOrganization {
  id: string
  slug: string
  name: string
}

export interface OrganizationsRepository {
  /** Org ativa pelo slug, ou `null`. Suspensa conta como inexistente aqui. */
  findActiveBySlug(slug: string): Promise<PublicOrganization | null>
  /**
   * Vínculos ativos dos mentores dados com orgs ativas de política aberta, em
   * UMA consulta (`in`), para não virar N+1 na lista de mentores.
   */
  listOpenOrganizationLinks(mentorIds: readonly string[]): Promise<MentorOrganizationLink[]>
  /** A linha inteira da org (qualquer status que a RLS deixe ver), ou `null`. */
  findById(id: string): Promise<Tables<"organizations"> | null>
  /** Todos os vínculos da org (ativos, convidados e pedidos), do mais novo ao mais antigo. */
  listMembers(organizationId: string): Promise<OrgMemberRow[]>
  /**
   * Sessões dos membros como mentorado (`as: "mentee"`) ou como mentor
   * (`as: "mentor"`), com as notas de feedback embutidas. `since` (ISO)
   * restringe por `scheduled_at`.
   */
  listAppointments(
    memberIds: readonly string[],
    as: "mentee" | "mentor",
    since: string | null
  ): Promise<OrgAppointment[]>
  /** Nomes de papel de plataforma (`user_roles`) por usuário. */
  listUserRoleNames(userIds: readonly string[]): Promise<Map<string, string[]>>
  /**
   * E-mails dos membros que fizeram o quiz, pela RPC `org_members_quiz_done`
   * (só devolve algo a admin ativo da org). Se a RPC falhar, devolve vazio e
   * loga: o dashboard continua, só sem o "Quiz: Sim".
   */
  quizDoneEmails(organizationId: string): Promise<string[]>
  /** Orgs em que a pessoa é admin ativo. */
  listAdminOrganizations(userId: string): Promise<AdminOrganization[]>
}

export function createOrganizationsRepository(db: SupabaseClient<Database>): OrganizationsRepository {
  return {
    async findActiveBySlug(slug) {
      const { data, error } = await db
        .from("organizations")
        .select("slug, name, type, join_policy")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle()
      if (error) throw new RepositoryError("organizations.findActiveBySlug", error)
      if (!data) return null
      return { ...data, join_policy: data.join_policy === "invite_only" ? "invite_only" : "open" }
    },

    async listOpenOrganizationLinks(mentorIds) {
      if (mentorIds.length === 0) return []
      // A ordem dos filtros importa só para o teste do service (o último `eq` fecha a cadeia).
      const { data, error } = await db
        .from("organization_members")
        .select("user_id, organizations!inner(name, slug, status, join_policy)")
        .in("user_id", [...mentorIds])
        .eq("status", "active")
        .eq("organizations.status", "active")
        .eq("organizations.join_policy", "open")
      if (error) throw new RepositoryError("organizations.listOpenOrganizationLinks", error)

      const links: MentorOrganizationLink[] = []
      for (const row of data ?? []) {
        // Com `!inner` o embed é um objeto; a tipagem gerada às vezes o anuncia como array.
        const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations
        if (org?.name && org?.slug) links.push({ user_id: row.user_id, name: org.name, slug: org.slug })
      }
      return links
    },

    async findById(id) {
      const { data, error } = await db.from("organizations").select("*").eq("id", id).maybeSingle()
      if (error) throw new RepositoryError("organizations.findById", error)
      return data
    },

    async listMembers(organizationId) {
      const { data, error } = await db
        .from("organization_members")
        .select("user_id, role, status, created_at, profiles(id, full_name, email)")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
      if (error) throw new RepositoryError("organizations.listMembers", error)

      return (data ?? []).map(row => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
        return {
          user_id: row.user_id,
          // CHECK constraints no banco garantem os valores; o tipo gerado é `string`.
          role: row.role as OrgMemberRole,
          status: row.status as MembershipStatus,
          created_at: row.created_at,
          profile: profile ?? null,
        }
      })
    },

    async listAppointments(memberIds, as, since) {
      if (memberIds.length === 0) return []
      const column = as === "mentee" ? "mentee_id" : "mentor_id"
      const out: OrgAppointment[] = []
      for (const ids of chunk(memberIds, IN_CHUNK)) {
        let query = db
          .from("appointments")
          // A nota vem embutida: antes era uma segunda consulta com TODOS os ids
          // das sessões concluídas na URL, que estourava em orgs grandes.
          .select("id, mentee_id, mentor_id, status, duration_minutes, scheduled_at, appointment_feedbacks(rating)")
          .in(column, ids)
        if (since) query = query.gte("scheduled_at", since)
        const { data, error } = await query
        if (error) throw new RepositoryError("organizations.listAppointments", error)
        for (const row of data ?? []) {
          out.push({
            id: row.id,
            mentee_id: row.mentee_id,
            mentor_id: row.mentor_id,
            status: row.status,
            duration_minutes: row.duration_minutes,
            ratings: (row.appointment_feedbacks ?? [])
              .map(f => f.rating)
              .filter((r): r is number => typeof r === "number"),
          })
        }
      }
      return out
    },

    async listUserRoleNames(userIds) {
      const byUser = new Map<string, string[]>()
      for (const ids of chunk(userIds, IN_CHUNK)) {
        const { data, error } = await db.from("user_roles").select("user_id, roles(name)").in("user_id", ids)
        if (error) throw new RepositoryError("organizations.listUserRoleNames", error)
        for (const row of data ?? []) {
          const role = Array.isArray(row.roles) ? row.roles[0] : row.roles
          if (!role?.name) continue
          byUser.set(row.user_id, [...(byUser.get(row.user_id) ?? []), role.name])
        }
      }
      return byUser
    },

    async quizDoneEmails(organizationId) {
      const { data, error } = await db.rpc("org_members_quiz_done", { p_org: organizationId })
      if (error) {
        console.warn("[organizations.quizDoneEmails]", error.message)
        return []
      }
      return (data ?? []).map(row => row.email)
    },

    async listAdminOrganizations(userId) {
      const { data, error } = await db
        .from("organization_members")
        .select("organization_id, organizations(id, slug, name)")
        .eq("user_id", userId)
        .eq("role", "admin")
        .eq("status", "active")
      if (error) throw new RepositoryError("organizations.listAdminOrganizations", error)

      const orgs: AdminOrganization[] = []
      for (const row of data ?? []) {
        const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations
        if (org) orgs.push({ id: org.id, slug: org.slug, name: org.name })
      }
      return orgs
    },
  }
}
