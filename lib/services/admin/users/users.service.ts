/**
 * Camada 7 · Service (usuários no painel admin)
 * Regra: lista e edita os usuários para o admin (a edição grava auditoria e
 * não deixa o admin retirar o próprio papel). Confere `assertAdmin` com a SESSÃO
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
  AdminProfileWriter,
  AdminUserAccessWriter,
  AdminUserCvReader,
  AdminUsersReader,
} from "@/lib/repositories/admin-users.repository"
import type { RolesCatalog } from "@/lib/repositories/user-roles.repository"
import type { AdminUserPatchBody } from "@/lib/schemas/admin-users"
import type { logAdminAction } from "@/lib/audit-logger"
import { cvLink } from "@/lib/services/mentees/cv-storage"
import { splitMenteeFields, withMenteeFields } from "@/lib/services/mentees/mentee-profile-fields"
import { withMentorFields } from "@/lib/services/mentors/mentor-profile-fields"
import { assertAdmin } from "../assert-admin"
import { AdminSelfActionError } from "../self-action.error"

export interface AdminUsersServiceDeps {
  /** Client da sessão do chamador: só serve para `assertAdmin` (nunca o privilegiado). */
  session: SupabaseClient<Database>
  /** Leitura pela sessão (RLS com `is_admin()`). */
  users: AdminUsersReader
  /** Leitura privilegiada do currículo; só é tocada depois do `assertAdmin`. */
  cv: AdminUserCvReader
  /** Escrita privilegiada de `profiles` (sem policy de escrita para admin, E7). */
  profiles: AdminProfileWriter
  /** Escrita de `mentee_profiles` e `user_roles` pela sessão (policies `is_admin()`). */
  access: AdminUserAccessWriter
  /** Catálogo de papéis, lido pela sessão. */
  roles: RolesCatalog
  /** Trilha de auditoria; nunca lança (falha de log não derruba a operação). */
  audit: typeof logAdminAction
}

export interface UpdateAdminUserInput {
  /** Admin que faz a chamada (vem do `requireAdmin` da rota). */
  actorId: string
  targetId: string
  body: AdminUserPatchBody
  /** Só para registrar IP e user-agent na auditoria. */
  request?: Request
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

/**
 * Troca os papéis só quando o conjunto mudou (evita disparar webhooks à toa).
 * @returns `{ from, to }` para a auditoria, ou `null` se nada mudou.
 */
async function replaceRolesIfChanged(
  deps: AdminUsersServiceDeps,
  userId: string,
  wanted: readonly string[]
): Promise<{ from: string[]; to: string[] } | null> {
  const current = await deps.access.findRoleNames(userId)
  const key = (names: readonly string[]) => [...names].sort().join(",")
  if (key(current) === key(wanted)) return null

  const found = await deps.roles.findByNames(wanted)
  await deps.access.replaceRoles(userId, found.map((role) => role.id))
  return { from: current, to: [...wanted] }
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

    /**
     * Edita perfil, dados acadêmicos e papéis de um usuário. A ordem é a de
     * sempre (mentorado, perfil, papéis); só `profiles` usa o client privilegiado.
     * @throws {AdminForbiddenError} quando a sessão não é de admin.
     * @throws {AdminSelfActionError} ao tentar retirar o próprio papel `admin`.
     */
    async updateUser({ actorId, targetId, body, request }: UpdateAdminUserInput) {
      await assertAdmin(deps.session)

      const { updates, roles } = body
      if (roles && actorId === targetId && !roles.includes("admin")) {
        throw new AdminSelfActionError("Você não pode retirar o próprio papel de administrador")
      }

      const { profile, mentee } = splitMenteeFields(updates)

      if (Object.keys(mentee).length > 0) await deps.access.upsertMentee(targetId, mentee)

      const updated = await deps.profiles.update(targetId, { ...profile, updated_at: new Date().toISOString() })

      const rolesChanged = roles ? await replaceRolesIfChanged(deps, targetId, roles) : null

      const email = updated.email ?? undefined
      await deps.audit(actorId, "user_updated", { fields: Object.keys(updates) }, targetId, email, request)
      if (rolesChanged) {
        await deps.audit(actorId, "user_role_changed", rolesChanged, targetId, email, request)
      }

      return updated
    },
  }
}

export type AdminUsersService = ReturnType<typeof createAdminUsersService>
