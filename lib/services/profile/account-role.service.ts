/**
 * Camada 7 · Service (papel mentor/mentee)
 * Regra: casos de uso de escolher o papel no onboarding e de deixar de ser
 * mentor. Aqui mora a PERMISSÃO (ADR 0008, regra 3): o único privilégio usado
 * é escrever `user_roles`, e só para os papéis `mentor` e `mentee` do próprio
 * `userId` da sessão. O tipo `ChosenRole` e a busca por nomes fixos impedem que
 * um valor vindo de fora vire `admin`.
 * Não faz: HTTP nem autenticação (camada 8).
 * Tradeoffs:
 *  - `mentor` e `mentee` são exclusivos: o oposto é removido antes de gravar o
 *    novo (senão rotas admin com `.single()` quebram). Quem pede mentoria
 *    continua `mentee` até o admin aprovar.
 *  - Em `stopMentoring` o papel é trocado POR ÚLTIMO. A verificação sai e o
 *    perfil some do catálogo antes; se um desses falhar, o usuário continua com
 *    o papel e pode tentar de novo. Antes o papel saía primeiro e uma falha da
 *    RPC o deixava sem papel e ainda aprovado.
 *  - Falhas ao trocar o papel são só registradas (como sempre foi): o perfil já
 *    foi gravado e a resposta não deve virar 500 por isso.
 */
import type { RoleProfileData } from "@/lib/schemas/profile"
import type { MentorRequestRepository } from "@/lib/repositories/mentor-request.repository"
import type { AccountRoleRepository, OnboardingProfileFields } from "@/lib/repositories/account-role.repository"
import { ProfileRepositoryError } from "@/lib/repositories/profile.repository"
import type { RolesCatalog, UserRolesRepository } from "@/lib/repositories/user-roles.repository"
import type { ProfileMailer } from "@/lib/ports/profile-mailer"

/** Os únicos papéis que este service sabe atribuir. */
export type ChosenRole = "mentor" | "mentee"
const EXCLUSIVE_ROLES: readonly ChosenRole[] = ["mentor", "mentee"]

export interface AccountRoleServiceDeps {
  profile: AccountRoleRepository
  verification: Pick<MentorRequestRepository, "requestVerification" | "withdrawVerification">
  catalog: RolesCatalog
  userRoles: UserRolesRepository
  mailer: Pick<ProfileMailer, "notifyNewMentee">
  now?: () => Date
}

export interface AccountRoleUser {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

export type ChooseRoleOutcome = { kind: "ok"; role: ChosenRole; status: "pending" | "approved" } | { kind: "failed" }
export type StopMentoringOutcome =
  | { kind: "ok"; profile: { id: string; is_public: boolean | null } }
  | { kind: "failed"; cause: unknown }

/** Campos do onboarding que de fato são gravados (o schema já descartou o resto). */
function toProfileFields(data: RoleProfileData | undefined, updatedAt: string): OnboardingProfileFields {
  const fields: OnboardingProfileFields = { updated_at: updatedAt }
  if (!data) return fields
  if (typeof data.bio === "string") fields.bio = data.bio
  if (typeof data.job_title === "string") fields.job_title = data.job_title
  if (typeof data.company === "string") fields.company = data.company
  if (typeof data.linkedin_url === "string") fields.linkedin_url = data.linkedin_url
  if (typeof data.city === "string") fields.city = data.city
  if (typeof data.state === "string") fields.state = data.state
  if (typeof data.country === "string") fields.country = data.country
  if (Array.isArray(data.expertise_areas)) fields.expertise_areas = data.expertise_areas
  if (Array.isArray(data.mentorship_topics)) fields.mentorship_topics = data.mentorship_topics
  return fields
}

const rawCause = (error: unknown) => (error instanceof ProfileRepositoryError ? error.dbError : error)

export function createAccountRoleService({
  profile,
  verification,
  catalog,
  userRoles,
  mailer,
  now = () => new Date(),
}: AccountRoleServiceDeps) {
  /** Deixa o usuário só com `keep` entre mentor/mentee. Devolve `true` se `keep` foi criado agora. */
  async function exclusiveRole(userId: string, keep: ChosenRole): Promise<boolean> {
    let roles
    try {
      roles = await catalog.findByNames(EXCLUSIVE_ROLES)
    } catch (error) {
      console.error("[accountRole] roles lookup failed:", (error as Error).message)
      return false
    }

    const idOf = new Map(roles.map((role) => [role.name, role.id]))
    const others = EXCLUSIVE_ROLES.filter((name) => name !== keep)
      .map((name) => idOf.get(name))
      .filter((id): id is number => id !== undefined)

    try {
      await userRoles.remove(userId, others)
    } catch (error) {
      console.error("[accountRole] remove role failed:", (error as Error).message)
    }

    const keepId = idOf.get(keep)
    if (keepId === undefined) return false
    try {
      return await userRoles.addIfMissing(userId, keepId)
    } catch (error) {
      console.error("[accountRole] add role failed:", (error as Error).message)
      return false
    }
  }

  return {
    async chooseRole(
      user: AccountRoleUser,
      role: ChosenRole,
      profileData: RoleProfileData | undefined
    ): Promise<ChooseRoleOutcome> {
      try {
        await profile.updateProfileFields(user.id, toProfileFields(profileData, now().toISOString()))
        if (typeof profileData?.learning_goals === "string") {
          await profile.upsertLearningGoals(user.id, profileData.learning_goals)
        }

        // Candidato a mentor entra na fila; o admin aprova em mentor_profiles.verification_status.
        if (role === "mentor") {
          await verification.requestVerification()
          if (Array.isArray(profileData?.inclusive_tags)) {
            await profile.saveInclusiveTags(user.id, profileData.inclusive_tags).catch((error) =>
              console.error("[accountRole] inclusive tags failed:", (error as Error).message)
            )
          }
        }
      } catch (error) {
        console.error("[accountRole.chooseRole]", (error as Error).message)
        return { kind: "failed" }
      }

      // Quem pede mentoria entra como mentorado até o admin aprovar.
      const created = await exclusiveRole(user.id, role === "mentor" ? "mentee" : role)

      if (created && role === "mentee" && user.email) {
        const metadata = user.user_metadata ?? {}
        const name = (metadata.full_name as string) || (metadata.name as string) || "Mentorado"
        Promise.resolve(mailer.notifyNewMentee({ email: user.email, name })).catch((err) =>
          console.error("[ONBOARDING] Erro ao enviar e-mail de perfil completo:", err)
        )
      }

      return { kind: "ok", role, status: role === "mentor" ? "pending" : "approved" }
    },

    async stopMentoring(userId: string): Promise<StopMentoringOutcome> {
      let hidden
      try {
        await verification.withdrawVerification()
        hidden = await profile.hideProfile(userId)
      } catch (error) {
        return { kind: "failed", cause: rawCause(error) }
      }

      // Os textos de mentor ficam, caso volte a mentorar. O papel é o último passo.
      await exclusiveRole(userId, "mentee")
      return { kind: "ok", profile: hidden }
    },
  }
}

export type AccountRoleService = ReturnType<typeof createAccountRoleService>
