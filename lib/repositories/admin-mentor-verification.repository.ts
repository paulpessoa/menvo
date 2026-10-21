/**
 * Camada 5 · Repository (candidaturas de mentor no painel admin)
 * Regra: único ponto que fala com `mentor_profiles` (+ embed de `profiles`) e
 * `mentors_view` para as filas do admin, e com `profiles`/`mentor_profiles`
 * para gravar a decisão. Contratos separados de propósito:
 *  - `AdminMentorApplicationsReader` e `AdminMentorsReader` LEEM pela SESSÃO:
 *    as policies `is_admin()` de `mentor_profiles` e `profiles` já liberam o admin;
 *  - `AdminMentorDecisionWriter` ESCREVE com o client privilegiado (ADR 0009,
 *    E7): `profiles` não tem policy de escrita de admin e `mentor_profiles` não
 *    tem grant para usuário comum. O client chega como função e só nasce na hora
 *    da escrita, depois do `assertAdmin` do service.
 * O currículo (`mentee_profiles.cv_url`) reaproveita `AdminUserCvReader` de
 * `admin-users.repository`.
 * Não faz: conferir se quem chama é admin (service), decidir o formato da
 * resposta nem mexer em papéis (`user-roles.repository`).
 * Tradeoff: a linha da fila é descrita à mão (`MentorApplicationRow`) porque o
 * select tem embed `!inner` e o supabase-js não infere o tipo com segurança.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/lib/types/supabase"
import { RepositoryError } from "./repository-error"

export type MentorApplicationStatus = "pending" | "approved" | "rejected" | "changes_requested"

/** Linha da fila: decisão em `mentor_profiles` + dados de `profiles`. */
export interface MentorApplicationRow {
  user_id: string
  verification_status: string | null
  mentorship_approach: string | null
  what_to_expect: string | null
  created_at: string | null
  updated_at: string | null
  profiles: Pick<
    Tables<"profiles">,
    | "id"
    | "email"
    | "full_name"
    | "first_name"
    | "last_name"
    | "job_title"
    | "company"
    | "bio"
    | "expertise_areas"
    | "linkedin_url"
    | "created_at"
  >
}

export interface AdminMentorApplicationsReader {
  /** Candidaturas nos status pedidos, da mais recentemente atualizada para a mais antiga. */
  listByStatus(statuses: readonly MentorApplicationStatus[], limit: number): Promise<MentorApplicationRow[]>
}

export interface AdminMentorsReader {
  /** Linhas de `mentors_view` (sem e-mail: a view é pública), mais novas primeiro. */
  listMentors(): Promise<Record<string, unknown>[]>
  /** E-mails de `profiles` por id (só admin lê). */
  findEmails(ids: readonly string[]): Promise<{ id: string; email: string | null }[]>
}

export interface AdminMentorDecisionWriter {
  /** Atualiza `profiles` e devolve o que o aviso precisa; `null` se o perfil não existe. */
  updateProfile(
    userId: string,
    patch: TablesUpdate<"profiles">
  ): Promise<Pick<Tables<"profiles">, "id" | "email" | "full_name"> | null>
  /** Grava (cria ou atualiza) a decisão em `mentor_profiles`. */
  upsertDecision(row: TablesInsert<"mentor_profiles">): Promise<void>
}

const APPLICATION_SELECT = `
  user_id, verification_status, mentorship_approach, what_to_expect, created_at, updated_at,
  profiles!inner(id, email, full_name, first_name, last_name, job_title, company, bio,
                 expertise_areas, linkedin_url, created_at)
`

/** Leitura pela sessão do admin (policy `is_admin()` nas duas tabelas). */
export function createAdminMentorApplicationsReader(db: SupabaseClient<Database>): AdminMentorApplicationsReader {
  return {
    async listByStatus(statuses, limit) {
      const { data, error } = await db
        .from("mentor_profiles")
        .select(APPLICATION_SELECT)
        .in("verification_status", [...statuses])
        .order("updated_at", { ascending: false })
        .limit(limit)
      if (error) throw new RepositoryError("adminMentorVerification.listByStatus", error)
      return (data ?? []) as unknown as MentorApplicationRow[]
    },
  }
}

/** Leitura pela sessão do admin. */
export function createAdminMentorsReader(db: SupabaseClient<Database>): AdminMentorsReader {
  return {
    async listMentors() {
      const { data, error } = await db
        .from("mentors_view")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw new RepositoryError("adminMentorVerification.listMentors", error)
      return (data ?? []) as Record<string, unknown>[]
    },

    async findEmails(ids) {
      if (ids.length === 0) return []
      const { data, error } = await db.from("profiles").select("id, email").in("id", [...ids])
      if (error) throw new RepositoryError("adminMentorVerification.findEmails", error)
      return data ?? []
    },
  }
}

/** Privilegiado (ADR 0009): o service já conferiu `assertAdmin` antes de chamar. */
export function createAdminMentorDecisionWriter(getDb: () => SupabaseClient<Database>): AdminMentorDecisionWriter {
  return {
    async updateProfile(userId, patch) {
      const { data, error } = await getDb()
        .from("profiles")
        .update(patch)
        .eq("id", userId)
        .select("id, email, full_name")
        .maybeSingle()
      if (error) throw new RepositoryError("adminMentorVerification.updateProfile", error)
      return data
    },

    async upsertDecision(row) {
      const { error } = await getDb().from("mentor_profiles").upsert(row, { onConflict: "user_id" })
      if (error) throw new RepositoryError("adminMentorVerification.upsertDecision", error)
    },
  }
}
