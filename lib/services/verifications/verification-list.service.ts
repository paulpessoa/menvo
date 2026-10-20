/**
 * Camada 7 · Service (filas de candidatura de mentor no painel admin)
 * Regra: lê de `mentor_profiles` (verificação só existe para quem pediu para ser
 * mentor, então os mentorados com o antigo `profiles.verification_status =
 * 'approved'` não aparecem mais em "concluídas") e monta o formato que a tela
 * consome. Confere `assertAdmin` com a SESSÃO antes de qualquer leitura, porque
 * os links de currículo vêm de um client privilegiado (ADR 0008 §2.3, ADR 0009).
 * Não faz: HTTP, criar client nem decidir candidatura (`notification.service`).
 * Tradeoff: o currículo depende das linhas, então vem depois da lista, em uma
 * única consulta em lote (sem N+1).
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import type { Verification } from "@/lib/types/models/verification"
import type {
  AdminMentorApplicationsReader,
  AdminMentorsReader,
  MentorApplicationStatus,
} from "@/lib/repositories/admin-mentor-verification.repository"
import type { AdminUserCvReader } from "@/lib/repositories/admin-users.repository"
import { cvLink } from "@/lib/services/mentees/cv-storage"
import { assertAdmin } from "@/lib/services/admin/assert-admin"

export type { MentorApplicationStatus }

export interface MentorVerificationListDeps {
  /** Client da sessão do chamador: só serve para `assertAdmin`. */
  session: SupabaseClient<Database>
  /** Fila de candidaturas, lida pela sessão (RLS `is_admin()`). */
  applications: AdminMentorApplicationsReader
  /** Lista de mentores aprovados, lida pela sessão. */
  mentors: AdminMentorsReader
  /** Leitura privilegiada do currículo; só é tocada depois do `assertAdmin`. */
  cv: AdminUserCvReader
}

const DEFAULT_LIMIT = 100

export function createMentorVerificationListService(deps: MentorVerificationListDeps) {
  return {
    /**
     * Candidaturas nos status pedidos, com o link de currículo quando existe.
     * @throws {AdminForbiddenError} quando a sessão não é de admin.
     */
    async listVerifications(
      statuses: readonly MentorApplicationStatus[],
      { limit = DEFAULT_LIMIT }: { limit?: number } = {}
    ): Promise<Verification[]> {
      await assertAdmin(deps.session)

      const rows = await deps.applications.listByStatus(statuses, limit)

      const stored = await deps.cv.findStoredCvUrls(rows.map((row) => row.user_id))
      const cvUrls = new Map<string, string>()
      for (const { user_id, cv_url } of stored) {
        // Devolve o link do Menvo (/api/cv/<id>), nunca o caminho no bucket.
        const link = cvLink(user_id, cv_url)
        if (link) cvUrls.set(user_id, link)
      }

      return rows.map((row) => {
        const profile = row.profiles
        return {
          id: row.user_id,
          mentor_id: row.user_id,
          mentor_name:
            profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Mentor",
          mentor_email: profile.email || "",
          mentor_title: profile.job_title || "Mentor",
          mentor_company: profile.company || "",
          mentor_bio: profile.bio,
          mentor_expertise_areas: profile.expertise_areas,
          mentorship_approach: row.mentorship_approach,
          what_to_expect: row.what_to_expect,
          linkedin_url: profile.linkedin_url,
          cv_url: cvUrls.get(row.user_id) ?? null,
          verification_type: "Identity",
          status: row.verification_status ?? "pending",
          created_at: profile.created_at || row.created_at || "",
          updated_at: row.updated_at,
        } as Verification
      })
    },

    /**
     * Mentores de `mentors_view` com o e-mail de `profiles` (a view é pública e
     * não carrega e-mail, migração 20260929160000).
     * @throws {AdminForbiddenError} quando a sessão não é de admin.
     */
    async listMentors(): Promise<Record<string, unknown>[]> {
      await assertAdmin(deps.session)

      const mentors = await deps.mentors.listMentors()
      const ids = mentors.flatMap((m) => (typeof m.id === "string" ? [m.id] : []))
      const emails = new Map((await deps.mentors.findEmails(ids)).map((row) => [row.id, row.email]))

      return mentors.map((m) => ({
        ...m,
        email: (typeof m.id === "string" && emails.get(m.id)) || null,
      }))
    },
  }
}

export type MentorVerificationListService = ReturnType<typeof createMentorVerificationListService>
