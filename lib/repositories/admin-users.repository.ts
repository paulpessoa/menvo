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
 * A ESCRITA segue a mesma divisão: `profiles` não tem policy de escrita para
 * admin (E7), então `AdminProfileWriter` é privilegiado; `mentee_profiles` e
 * `user_roles` têm policy `is_admin()`, então `AdminUserAccessWriter` roda com
 * a SESSÃO e o banco ainda recusa quem não for admin.
 * Não faz: conferir se quem chama é admin (`assertAdmin` no service) nem
 * montar o formato da resposta (o service achata).
 * Tradeoff: o select é montado por filtro (`!inner` muda o nível do filtro no
 * PostgREST), então o supabase-js não infere o tipo da linha; ela é descrita
 * por `AdminProfileRow`, a mesma forma que a rota já assumia.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, Tables, TablesUpdate } from "@/lib/types/supabase"
import type { MenteeEditableFields } from "@/lib/services/mentees/mentee-profile-fields"
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

export interface AdminProfileWriter {
  /** Atualiza `profiles` e devolve a linha gravada. Lança se o perfil não existe. */
  update(userId: string, patch: TablesUpdate<"profiles">): Promise<Tables<"profiles">>
}

export interface AdminUserAccessWriter {
  /** Cria ou atualiza a linha de `mentee_profiles` do usuário. */
  upsertMentee(userId: string, fields: MenteeEditableFields): Promise<void>
  /** Nomes dos papéis atuais do usuário. */
  findRoleNames(userId: string): Promise<string[]>
  /** Apaga todos os papéis e grava os dados (não é atômico: M-A1, D4). */
  replaceRoles(userId: string, roleIds: readonly number[]): Promise<void>
}

/**
 * Privilegiado (ADR 0009). O service já conferiu `assertAdmin`; o client só
 * nasce aqui dentro, na hora da escrita.
 */
export function createAdminProfileWriter(getDb: () => SupabaseClient<Database>): AdminProfileWriter {
  return {
    async update(userId, patch) {
      const { data, error } = await getDb().from("profiles").update(patch).eq("id", userId).select().single()
      if (error) throw new RepositoryError("adminUsers.updateProfile", error)
      return data
    },
  }
}

/** Pela sessão do admin: as policies `is_admin()` de `mentee_profiles` e `user_roles` liberam. */
export function createAdminUserAccessWriter(db: SupabaseClient<Database>): AdminUserAccessWriter {
  return {
    async upsertMentee(userId, fields) {
      const { error } = await db
        .from("mentee_profiles")
        .upsert({ user_id: userId, ...fields }, { onConflict: "user_id" })
      if (error) throw new RepositoryError("adminUsers.upsertMentee", error)
    },

    async findRoleNames(userId) {
      const { data, error } = await db.from("user_roles").select("roles(name)").eq("user_id", userId)
      if (error) throw new RepositoryError("adminUsers.findRoleNames", error)
      return (data ?? []).flatMap((row) => (row.roles?.name ? [row.roles.name] : []))
    },

    async replaceRoles(userId, roleIds) {
      const removed = await db.from("user_roles").delete().eq("user_id", userId)
      if (removed.error) throw new RepositoryError("adminUsers.replaceRoles", removed.error)
      if (roleIds.length === 0) return
      const inserted = await db
        .from("user_roles")
        .insert(roleIds.map((role_id) => ({ user_id: userId, role_id })))
      if (inserted.error) throw new RepositoryError("adminUsers.replaceRoles", inserted.error)
    },
  }
}
