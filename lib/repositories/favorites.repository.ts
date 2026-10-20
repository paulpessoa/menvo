/**
 * Camada 5 · Repository (favoritos)
 * Regra: único ponto que fala com `user_favorites`. Recebe o client DA SESSÃO:
 * quem lê e escreve o quê é decidido pelo RLS, nunca por `service_role`. Mesmo
 * assim todo método filtra por `user_id` explicitamente (defesa em duas camadas).
 * Não faz: regra de negócio (camada 7) nem criar client.
 * Tradeoff: a tabela e a RLS ainda não estão em nenhuma migration (audit, achado
 * 9). O teste `supabase/tests/user_favorites_access.test.sql` prova o estado real
 * do banco até a migration futura (D3) versionar a tabela.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { RepositoryError } from "./repository-error"

export interface FavoritesRepository {
  listMentorIds(userId: string): Promise<string[]>
  add(userId: string, mentorId: string): Promise<void>
  remove(userId: string, mentorId: string): Promise<void>
}

export function createFavoritesRepository(db: SupabaseClient<Database>): FavoritesRepository {
  return {
    async listMentorIds(userId) {
      const { data, error } = await db.from("user_favorites").select("mentor_id").eq("user_id", userId)
      if (error) throw new RepositoryError("favorites.listMentorIds", error)
      return (data ?? []).map((row) => row.mentor_id)
    },

    async add(userId, mentorId) {
      const { error } = await db.from("user_favorites").insert({ user_id: userId, mentor_id: mentorId })
      if (error) throw new RepositoryError("favorites.add", error)
    },

    async remove(userId, mentorId) {
      const { error } = await db.from("user_favorites").delete().eq("user_id", userId).eq("mentor_id", mentorId)
      if (error) throw new RepositoryError("favorites.remove", error)
    },
  }
}
