/**
 * Camada 5 · Repository (perfil próprio)
 * Regra: único ponto que fala com `profiles`, `mentor_profiles` e
 * `mentee_profiles` para o perfil do próprio usuário. O select (colunas +
 * embeds) nasce AQUI, uma vez: em 2026-10-15 (f95c9da5) a lista copiada em duas
 * rotas perdeu `is_public` e cada "Salvar" tirou o mentor do catálogo.
 * Não faz: regra de negócio (ordem das escritas, 409 de slug, e-mail) nem criar
 * client; quem escolhe o client é a composição.
 * Tradeoff: o erro do driver vira `ProfileRepositoryError`, que guarda também o
 * `code` e a mensagem crua. A rota ainda devolve `details` ao cliente (formato
 * atual, mudar é a decisão D4 do Paul) e o service precisa do `code` (`23505`,
 * `PGRST116`); por isso não usamos só o `RepositoryError` genérico.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, Json, TablesInsert, TablesUpdate } from "@/lib/types/supabase"
import { OWN_PROFILE_COLUMNS } from "@/lib/services/auth/own-profile-columns"
import { MENTOR_PROFILE_EMBED, type MentorEditableFields } from "@/lib/services/mentors/mentor-profile-fields"
import { MENTEE_PROFILE_EMBED_WITH_CV, type MenteeEditableFields } from "@/lib/services/mentees/mentee-profile-fields"
import { RepositoryError } from "./repository-error"

/** Select do perfil próprio: colunas de `profiles` + mentor + mentorado (com currículo). */
export const PROFILE_SELECT = `${OWN_PROFILE_COLUMNS}, ${MENTOR_PROFILE_EMBED}, ${MENTEE_PROFILE_EMBED_WITH_CV}` as const

/**
 * Linha como o PostgREST devolve, ainda com os embeds `mentor_profiles` e
 * `mentee_profiles` aninhados. Tipo solto de propósito: a forma é garantida pelo
 * `PROFILE_SELECT` e pelo teste de contrato; o service a achata.
 */
export type OwnProfileRow = { id: string } & Record<string, unknown>

export type ProfileFieldsUpdate = TablesUpdate<"profiles">
export type NewProfile = Pick<TablesInsert<"profiles">, "id" | "email" | "first_name" | "last_name">

export class ProfileRepositoryError extends RepositoryError {
  constructor(
    operation: string,
    public readonly dbError: { message?: string; code?: string } | null | undefined
  ) {
    super(operation, dbError)
    this.name = "ProfileRepositoryError"
  }

  get code(): string | undefined {
    return this.dbError?.code
  }

  /** Mensagem crua do banco, como a rota a devolve em `details`. */
  get dbMessage(): string | undefined {
    return this.dbError?.message
  }
}

export interface ProfileRepository {
  /** `null` quando o usuário ainda não tem linha em `profiles`. */
  findOwn(userId: string): Promise<OwnProfileRow | null>
  insertOwn(profile: NewProfile): Promise<OwnProfileRow>
  /** Falha (PGRST116) se a linha não existir, em vez de "atualizar 0 linhas" em silêncio. */
  updateProfile(userId: string, fields: ProfileFieldsUpdate): Promise<void>
  /** `update`, não upsert: só mentor ou candidato tem linha (criada pela RPC request_mentor_verification). */
  updateMentorFields(userId: string, fields: MentorEditableFields): Promise<void>
  /** Upsert: quem nunca preencheu dados acadêmicos não tem linha. */
  upsertMenteeFields(userId: string, fields: MenteeEditableFields): Promise<void>
  /** Flags dos tours guiados. Perfil sem linha = nenhuma flag. */
  findOnboardingFlags(userId: string): Promise<OnboardingFlags>
  setOnboardingFlags(userId: string, flags: OnboardingFlags): Promise<void>
}

export type OnboardingFlags = Record<string, Json | undefined>

export function createProfileRepository(db: SupabaseClient<Database>): ProfileRepository {
  return {
    async findOwn(userId) {
      const { data, error } = await db.from("profiles").select(PROFILE_SELECT).eq("id", userId).single()
      if (error) {
        if (error.code === "PGRST116") return null
        throw new ProfileRepositoryError("profile.findOwn", error)
      }
      return data as OwnProfileRow
    },

    async insertOwn(profile) {
      const { data, error } = await db.from("profiles").insert(profile).select(PROFILE_SELECT).single()
      if (error) throw new ProfileRepositoryError("profile.insertOwn", error)
      return data as OwnProfileRow
    },

    async updateProfile(userId, fields) {
      const { error } = await db.from("profiles").update(fields).eq("id", userId).select("id").single()
      if (error) throw new ProfileRepositoryError("profile.updateProfile", error)
    },

    async updateMentorFields(userId, fields) {
      const { error } = await db.from("mentor_profiles").update(fields).eq("user_id", userId)
      if (error) throw new ProfileRepositoryError("profile.updateMentorFields", error)
    },

    async upsertMenteeFields(userId, fields) {
      const { error } = await db
        .from("mentee_profiles")
        .upsert({ user_id: userId, ...fields }, { onConflict: "user_id" })
      if (error) throw new ProfileRepositoryError("profile.upsertMenteeFields", error)
    },

    async findOnboardingFlags(userId) {
      const { data, error } = await db.from("profiles").select("onboarding_flags").eq("id", userId).single()
      if (error) {
        if (error.code === "PGRST116") return {}
        throw new ProfileRepositoryError("profile.findOnboardingFlags", error)
      }
      const flags = data?.onboarding_flags
      return flags && typeof flags === "object" && !Array.isArray(flags) ? flags : {}
    },

    async setOnboardingFlags(userId, flags) {
      const { error } = await db.from("profiles").update({ onboarding_flags: flags }).eq("id", userId)
      if (error) throw new ProfileRepositoryError("profile.setOnboardingFlags", error)
    },
  }
}
