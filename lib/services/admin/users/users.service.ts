/**
 * Camada 7 · Service (usuários no painel admin)
 * Regra: lista os usuários para o admin. Confere `assertAdmin` com a SESSÃO
 * antes de qualquer leitura (ADR 0008 §2.3, ADR 0009): a rota já passou por
 * `requireAdmin`, mas o service não confia nisso porque a leitura de currículo
 * roda com privilégio. Achata o item no formato que a tela consome.
 * Não faz: HTTP, validação da query (Zod na rota) nem criar client.
 * Tradeoff: lista, contagens e links de currículo vão em paralelo quando
 * possível; os currículos dependem das linhas, então vêm depois.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import type { AdminUserView } from "@/lib/domain/admin/user.entity"
import type { AdminUsersQuery } from "@/lib/schemas/admin-users"
import type {
  AdminProfileRow,
  AdminUserCounts,
  AdminUserCvReader,
  AdminUsersReader,
} from "@/lib/repositories/admin-users.repository"
import { cvLink } from "@/lib/services/mentees/cv-storage"
import { withMenteeFields } from "@/lib/services/mentees/mentee-profile-fields"
import { withMentorFields } from "@/lib/services/mentors/mentor-profile-fields"
import { assertAdmin } from "../assert-admin"

export interface AdminUsersServiceDeps {
  /** Client da sessão do chamador: só serve para `assertAdmin` (nunca o privilegiado). */
  session: SupabaseClient<Database>
  /** Leitura pela sessão (RLS com `is_admin()`). */
  users: AdminUsersReader
  /** Leitura privilegiada do currículo; só é tocada depois do `assertAdmin`. */
  cv: AdminUserCvReader
}

export interface AdminUsersList {
  users: AdminUserView[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
  counts: AdminUserCounts
}

/** Achata mentor + mentorado + importação no formato da tela. */
function toAdminUserView(row: AdminProfileRow, cvUrls: Map<string, string>): AdminUserView {
  const { import_records, ...profile } = row
  return {
    ...withMenteeFields(withMentorFields(profile)),
    cv_url: cvUrls.get(row.id) ?? null,
    origin_platform: import_records?.origin_platform ?? "menvo",
    invite_sent_at: import_records?.invite_sent_at ?? null,
  } as unknown as AdminUserView
}

export function createAdminUsersService(deps: AdminUsersServiceDeps) {
  return {
    /**
     * @throws {AdminForbiddenError} quando a sessão não é de admin.
     */
    async listUsers(query: AdminUsersQuery): Promise<AdminUsersList> {
      await assertAdmin(deps.session)

      const [page, counts] = await Promise.all([deps.users.list(query), deps.users.counts()])

      const stored = await deps.cv.findStoredCvUrls(page.rows.map((row) => row.id))
      const cvUrls = new Map<string, string>()
      for (const { user_id, cv_url } of stored) {
        // Devolve o link do Menvo (/api/cv/<id>), nunca o caminho no bucket.
        const link = cvLink(user_id, cv_url)
        if (link) cvUrls.set(user_id, link)
      }

      return {
        users: page.rows.map((row) => toAdminUserView(row, cvUrls)),
        pagination: {
          page: query.page,
          limit: query.limit,
          total: page.total,
          totalPages: Math.ceil(page.total / query.limit),
        },
        counts,
      }
    },
  }
}

export type AdminUsersService = ReturnType<typeof createAdminUsersService>
