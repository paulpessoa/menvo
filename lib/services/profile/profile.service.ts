/**
 * Camada 7 · Service (perfil próprio)
 * Regra: casos de uso de ler e salvar o perfil de quem está logado. Recebe o
 * repository por parâmetro, então roda em teste com um fake em memória.
 * Não faz: HTTP nem autenticação (camada 8) e não escolhe o client do banco
 * (composição).
 * Tradeoff: o `UPDATE` de `profiles` vai ANTES dos de mentor e mentorado. O erro
 * mais provável do formulário é slug em uso (`23505`); vindo por último, o
 * usuário recebia 409 com mentor e mentorado já gravados. A troca elimina esse
 * caso sem migration e sem mudar a resposta. Continua sem ser atômico (dois
 * `UPDATE` em vez de RPC, decisão de docs/domains/profiles-schema.md), então uma
 * falha rara em mentor/mentorado ainda deixa `profiles` salvo.
 * Devolve uma união (`kind`) em vez de lançar, como o service do quiz.
 */
import type { OwnProfile } from "@/lib/domain/profile/profile.entity"
import type { UpdateProfileInput } from "@/lib/schemas/profile"
import { extractIdentity } from "@/lib/auth/oauth-identity"
import { cvLink } from "@/lib/services/mentees/cv-storage"
import { splitMenteeFields, withMenteeFields } from "@/lib/services/mentees/mentee-profile-fields"
import { splitMentorFields, withMentorFields } from "@/lib/services/mentors/mentor-profile-fields"
import {
  ProfileRepositoryError,
  type OwnProfileRow,
  type ProfileFieldsUpdate,
  type ProfileRepository,
} from "@/lib/repositories/profile.repository"

export interface ProfileServiceDeps {
  repo: ProfileRepository
  /** Injetável para teste; `updated_at` não vem do formulário. */
  now?: () => Date
}

/** Dados da sessão que o service usa; nada além disso entra em `profiles`. */
export interface SessionUser {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

/**
 * Perfil achatado, no formato que as telas e `/api/profile` sempre devolveram.
 * O select traz um subconjunto das colunas de `profiles`; o tipo é o `OwnProfile`
 * da entity, a mesma simplificação que o hook do cliente sempre fez.
 */
export type OwnProfilePayload = OwnProfile

export type GetOwnOutcome =
  | { kind: "ok"; profile: OwnProfilePayload }
  | { kind: "failed"; stage: "fetch" | "create"; message?: string }

export type UpdateOwnOutcome =
  | { kind: "ok"; profile: OwnProfilePayload }
  | { kind: "slug_taken" }
  | { kind: "failed"; message?: string }

/**
 * Achata mentor e mentorado de volta no perfil e troca o caminho do currículo
 * (bucket privado) pelo link da Menvo. Quem pede é o próprio dono.
 */
function toProfilePayload(row: OwnProfileRow): OwnProfilePayload {
  const profile = withMenteeFields(withMentorFields(row as OwnProfileRow & { mentor_profiles?: unknown }))
  return { ...profile, cv_url: cvLink(row.id, profile.cv_url) } as unknown as OwnProfilePayload
}

const messageOf = (error: unknown) =>
  error instanceof ProfileRepositoryError ? error.dbMessage : error instanceof Error ? error.message : undefined

export function createProfileService({ repo, now = () => new Date() }: ProfileServiceDeps) {
  return {
    /** Lê o perfil; cria a linha se a conta ainda não tem (cadastro por qualquer provedor). */
    async getOwn(user: SessionUser): Promise<GetOwnOutcome> {
      let row: OwnProfileRow | null
      try {
        row = await repo.findOwn(user.id)
      } catch (error) {
        return { kind: "failed", stage: "fetch", message: messageOf(error) }
      }
      if (row) return { kind: "ok", profile: toProfilePayload(row) }

      // Nome de qualquer provedor (e-mail, Google, LinkedIn...), não só das
      // chaves first_name/last_name do cadastro por e-mail.
      const identity = extractIdentity(user.user_metadata ?? null)
      try {
        const created = await repo.insertOwn({
          id: user.id,
          email: user.email || "",
          first_name: identity.firstName,
          last_name: identity.lastName,
        })
        return { kind: "ok", profile: toProfilePayload(created) }
      } catch (error) {
        return { kind: "failed", stage: "create", message: messageOf(error) }
      }
    },

    /** Salva o formulário de perfil e devolve o perfil já atualizado. */
    async updateOwn(userId: string, input: UpdateProfileInput): Promise<UpdateOwnOutcome> {
      const { profile: nonMentorFields, mentor: mentorFields } = splitMentorFields(input)
      const { profile: profileFields, mentee: menteeFields } = splitMenteeFields(nonMentorFields)

      try {
        await repo.updateProfile(userId, {
          ...(profileFields as ProfileFieldsUpdate),
          updated_at: now().toISOString(),
        })
      } catch (error) {
        if (error instanceof ProfileRepositoryError && error.code === "23505" && error.dbMessage?.includes("slug")) {
          return { kind: "slug_taken" }
        }
        console.error("❌ Profile update error:", error)
        return { kind: "failed", message: messageOf(error) }
      }

      try {
        if (Object.keys(mentorFields).length > 0) await repo.updateMentorFields(userId, mentorFields)
        if (Object.keys(menteeFields).length > 0) await repo.upsertMenteeFields(userId, menteeFields)

        const row = await repo.findOwn(userId)
        if (!row) return { kind: "failed", message: "Perfil não encontrado" }
        return { kind: "ok", profile: toProfilePayload(row) }
      } catch (error) {
        console.error("❌ Mentor/mentee profile update error:", error)
        return { kind: "failed", message: messageOf(error) }
      }
    },
  }
}

export type ProfileService = ReturnType<typeof createProfileService>
