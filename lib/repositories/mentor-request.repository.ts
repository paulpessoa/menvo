/**
 * Camada 5 · Repository (pedido para ser mentor)
 * Regra: único ponto que fala com o banco no pedido de mentoria: a RPC que
 * muda o status e o `UPDATE` dos textos em `mentor_profiles`. Sempre com o
 * client do usuário: o status só muda pela RPC `request_mentor_verification`
 * (o usuário não tem grant na coluna, migration 20261004000000).
 * Não faz: regra de negócio nem e-mail (camada 7).
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { ProfileRepositoryError } from "./profile.repository"

export interface MentorRequestRow {
  user_id: string
  verification_status: string | null
}

export interface MentorRequestRepository {
  /** Entra na fila de verificação; quem já está aprovado continua aprovado. */
  requestVerification(): Promise<void>
  /** Sai da verificação (RPC `withdraw_mentor_verification`); o status não tem grant de escrita. */
  withdrawVerification(): Promise<void>
  saveApproach(userId: string, texts: { mentorship_approach: string; what_to_expect: string | null }): Promise<MentorRequestRow>
}

export function createMentorRequestRepository(db: SupabaseClient<Database>): MentorRequestRepository {
  return {
    async requestVerification() {
      const { error } = await db.rpc("request_mentor_verification")
      if (error) throw new ProfileRepositoryError("mentorRequest.requestVerification", error)
    },

    async withdrawVerification() {
      const { error } = await db.rpc("withdraw_mentor_verification")
      if (error) throw new ProfileRepositoryError("mentorRequest.withdrawVerification", error)
    },

    async saveApproach(userId, texts) {
      const { data, error } = await db
        .from("mentor_profiles")
        .update(texts)
        .eq("user_id", userId)
        .select("user_id, verification_status")
        .single()
      if (error) throw new ProfileRepositoryError("mentorRequest.saveApproach", error)
      return data
    },
  }
}
