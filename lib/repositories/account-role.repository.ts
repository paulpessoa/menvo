/**
 * Camada 5 · Repository (dados de perfil gravados ao escolher ou largar o papel)
 * Regra: único ponto que grava `profiles`, `mentee_profiles` e
 * `mentor_profiles` no onboarding e no "deixar de ser mentor". Sempre com o
 * client DA SESSÃO: o RLS decide, nunca `service_role`. O status de
 * verificação não passa por aqui (só pelas RPCs, em `mentor-request.repository`).
 * Não faz: regra de negócio nem escolher o client.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { ProfileRepositoryError } from "./profile.repository"

/** Campos de `profiles` que o onboarding grava. Nunca `user_role`: a coluna não existe. */
export interface OnboardingProfileFields {
  updated_at: string
  bio?: string
  job_title?: string
  company?: string
  linkedin_url?: string
  city?: string
  state?: string
  country?: string
  expertise_areas?: string[]
  mentorship_topics?: string[]
}

export interface AccountRoleRepository {
  updateProfileFields(userId: string, fields: OnboardingProfileFields): Promise<void>
  upsertLearningGoals(userId: string, learningGoals: string): Promise<void>
  saveInclusiveTags(userId: string, tags: string[]): Promise<void>
  /** Tira o perfil do catálogo e devolve o estado gravado. */
  hideProfile(userId: string): Promise<{ id: string; is_public: boolean | null }>
}

export function createAccountRoleRepository(db: SupabaseClient<Database>): AccountRoleRepository {
  return {
    async updateProfileFields(userId, fields) {
      const { error } = await db.from("profiles").update(fields).eq("id", userId)
      if (error) throw new ProfileRepositoryError("accountRole.updateProfileFields", error)
    },

    async upsertLearningGoals(userId, learningGoals) {
      const { error } = await db
        .from("mentee_profiles")
        .upsert({ user_id: userId, learning_goals: learningGoals }, { onConflict: "user_id" })
      if (error) throw new ProfileRepositoryError("accountRole.upsertLearningGoals", error)
    },

    async saveInclusiveTags(userId, tags) {
      const { error } = await db.from("mentor_profiles").update({ inclusive_tags: tags }).eq("user_id", userId)
      if (error) throw new ProfileRepositoryError("accountRole.saveInclusiveTags", error)
    },

    async hideProfile(userId) {
      const { data, error } = await db
        .from("profiles")
        .update({ is_public: false })
        .eq("id", userId)
        .select("id, is_public")
        .single()
      if (error) throw new ProfileRepositoryError("accountRole.hideProfile", error)
      return data
    },
  }
}
