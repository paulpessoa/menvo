/**
 * Camada 7 · Service (favoritos do próprio usuário)
 * Regra: casos de uso de listar e alternar favoritos. O `userId` vem sempre da
 * sessão (a rota o entrega); nenhum método aceita o id de outra pessoa.
 * Não faz: HTTP nem autenticação (camada 8).
 * Tradeoff: devolve uma união (`kind`) em vez de lançar, como os outros
 * services, para a rota mapear cada caso a um status sem `try/catch`.
 */
import type { ToggleFavoriteInput } from "@/lib/schemas/me"
import type { FavoritesRepository } from "@/lib/repositories/favorites.repository"

export type ListFavoritesOutcome = { kind: "ok"; mentorIds: string[] } | { kind: "failed" }
export type ToggleFavoriteOutcome = { kind: "ok" } | { kind: "failed" }

export function createMyFavoritesService({ repo }: { repo: FavoritesRepository }) {
  return {
    async list(userId: string): Promise<ListFavoritesOutcome> {
      try {
        return { kind: "ok", mentorIds: await repo.listMentorIds(userId) }
      } catch (error) {
        console.error("[favorites.list]", (error as Error).message)
        return { kind: "failed" }
      }
    },

    async toggle(userId: string, { mentorId, action }: ToggleFavoriteInput): Promise<ToggleFavoriteOutcome> {
      try {
        if (action === "add") await repo.add(userId, mentorId)
        else await repo.remove(userId, mentorId)
        return { kind: "ok" }
      } catch (error) {
        console.error("[favorites.toggle]", (error as Error).message)
        return { kind: "failed" }
      }
    },
  }
}

export type MyFavoritesService = ReturnType<typeof createMyFavoritesService>
