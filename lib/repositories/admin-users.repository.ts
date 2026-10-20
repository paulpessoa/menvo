/**
 * Camada 5 · Repository (usuários no painel admin)
 * Regra: único ponto que fala com `profiles` (+ embeds de mentor, papéis e
 * importação) para a LISTA do admin. Dois contratos separados de propósito:
 *  - `AdminUsersReader` lê com o client da SESSÃO: as policies `is_admin()` de
 *    `profiles`, `mentor_profiles`, `import_records` e `user_roles` já liberam
 *    o admin, então não precisa de privilégio;
 *  - `AdminUserCvReader` lê `mentee_profiles.cv_url` e roda com o client
 *    privilegiado (ADR 0009): a coluna não tem grant para `authenticated`. O
 *    client chega como função e só nasce quando alguém pede.
 * Não faz: conferir se quem chama é admin (`assertAdmin` no service) nem
 * montar o formato da resposta (o service achata).
 * Tradeoff: o select é montado por filtro (`!inner` muda o nível do filtro no
 * PostgREST), então o supabase-js não infere o tipo da linha; ela é descrita
 * por `AdminProfileRow`, a mesma forma que a rota já assumia.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import type { AdminUsersQuery } from "@/lib/schemas/admin-users"
import { MENTOR_PROFILE_EMBED } from "@/lib/services/mentors/mentor-profile-fields"
import { RepositoryError } from "./repository-error"

/** Linha de `profiles` como o PostgREST devolve, ainda com os embeds aninhados. */
export type AdminProfileRow = Record<string, unknown> & {
  id: string
  import_records: { origin_platform: string; invite_sent_at: string | null } | null
  mentor_profiles?: unknown
  mentee_profiles?: unknown
}

export interface AdminUsersPage {
  rows: AdminProfileRow[]
  /** Total que bate com os filtros (para paginar). */
  total: number
}

/** Contagens das abas da tela, sem filtro. */
export interface AdminUserCounts {
  all: number
  pending: number
  mentors: number
  mentees: number
  menvoOrigin: number
  jotformOrigin: number
}

export interface AdminUsersReader {
  list(query: AdminUsersQuery): Promise<AdminUsersPage>
  counts(): Promise<AdminUserCounts>
}

export interface AdminUserCvReader {
  /** Valor guardado de `cv_url` por usuário; quem não tem currículo não volta. */
  findStoredCvUrls(userIds: readonly string[]): Promise<{ user_id: string; cv_url: string }[]>
}

/**
 * Monta o select da lista. Com filtro de origem JotForm, de status ou de papel
 * usamos `!inner` para filtrar o nível de `profiles` (embed nulo + `or()` não
 * funciona no PostgREST). Os dados de importação vivem em `import_records`
 * (1:1, só admin lê).
 */
function buildSelect(query: AdminUsersQuery): string {
  const importEmbed =
    query.origin === "jotform"
      ? "import_records!inner (origin_platform, invite_sent_at)"
      : "import_records (origin_platform, invite_sent_at)"

  const mentorEmbed =
    query.status === "pending" || query.status === "verified"
      ? MENTOR_PROFILE_EMBED.replace("mentor_profiles(", "mentor_profiles!inner(")
      : MENTOR_PROFILE_EMBED

  const rolesEmbed =
    query.role === undefined
      ? "user_roles (roles (name))"
      : "user_roles!inner (roles!inner (name))"

  return `*, ${importEmbed}, ${mentorEmbed}, ${rolesEmbed}`
}

export function createAdminUsersReader(db: SupabaseClient<Database>): AdminUsersReader {
  return {
    async list(query) {
      let q = db.from("profiles").select(buildSelect(query), { count: "exact" })

      if (query.role) q = q.eq("user_roles.roles.name", query.role)

      if (query.status === "pending") q = q.eq("mentor_profiles.verification_status", "pending")
      else if (query.status === "verified") q = q.eq("mentor_profiles.verification_status", "approved")

      if (query.search) q = q.or(`full_name.ilike.%${query.search}%,email.ilike.%${query.search}%`)

      // "jotform" = tem registro de importação com origem jotform;
      // "menvo" = nunca foi importado (sem registro).
      if (query.origin === "jotform") q = q.eq("import_records.origin_platform", "jotform")
      else if (query.origin === "menvo") q = q.is("import_records", null)

      const from = (query.page - 1) * query.limit
      const { data, error, count } = await q
        .order(query.sort_by, { ascending: query.sort_order === "asc" })
        .range(from, from + query.limit - 1)

      if (error) throw new RepositoryError("adminUsers.list", error)
      return { rows: (data ?? []) as unknown as AdminProfileRow[], total: count ?? 0 }
    },

    async counts() {
      const [all, pending, mentors, mentees, menvoOrigin, jotformOrigin] = await Promise.all([
        db.from("profiles").select("*", { count: "exact", head: true }),
        db
          .from("mentor_profiles")
          .select("user_id", { count: "exact", head: true })
          .eq("verification_status", "pending"),
        db
          .from("profiles")
          .select("user_roles!inner(roles!inner(name))", { count: "exact", head: true })
          .eq("user_roles.roles.name", "mentor"),
        db
          .from("profiles")
          .select("user_roles!inner(roles!inner(name))", { count: "exact", head: true })
          .eq("user_roles.roles.name", "mentee"),
        db
          .from("profiles")
          .select("id, import_records(user_id)", { count: "exact", head: true })
          .is("import_records", null),
        db
          .from("import_records")
          .select("*", { count: "exact", head: true })
          .eq("origin_platform", "jotform"),
      ])

      return {
        all: all.count ?? 0,
        pending: pending.count ?? 0,
        mentors: mentors.count ?? 0,
        mentees: mentees.count ?? 0,
        menvoOrigin: menvoOrigin.count ?? 0,
        jotformOrigin: jotformOrigin.count ?? 0,
      }
    },
  }
}

/**
 * Privilegiado (ADR 0009). O chamador (service) já conferiu `assertAdmin`
 * antes de pedir; o client só é criado aqui dentro, na hora da leitura.
 */
export function createAdminUserCvReader(getDb: () => SupabaseClient<Database>): AdminUserCvReader {
  return {
    async findStoredCvUrls(userIds) {
      if (userIds.length === 0) return []
      const { data, error } = await getDb()
        .from("mentee_profiles")
        .select("user_id, cv_url")
        .in("user_id", [...userIds])
        .not("cv_url", "is", null)
      if (error) throw new RepositoryError("adminUsers.findStoredCvUrls", error)
      return (data ?? []).flatMap((row) => (row.cv_url ? [{ user_id: row.user_id, cv_url: row.cv_url }] : []))
    },
  }
}
