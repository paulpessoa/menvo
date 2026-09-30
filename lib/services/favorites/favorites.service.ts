/**
 * Client-side wrapper around GET/POST /api/me/favorites. Used to read/write
 * `user_favorites` straight from the browser with a client-supplied userId
 * (docs/COMMUNITY_CONTACT_PLAN.md §13); kept as a thin fetch layer, same
 * method names, so `hooks/useFavorites.ts` didn't need to change. `userId`
 * is accepted but unused - the server derives it from the session.
 */
class FavoritesService {
  async getFavorites(_userId: string): Promise<string[]> {
    const res = await fetch("/api/me/favorites")
    if (!res.ok) throw new Error("Erro ao carregar favoritos")
    const { favorites } = await res.json()
    return favorites
  }

  async addFavorite(_userId: string, mentorId: string): Promise<void> {
    await this.toggle(mentorId, "add")
  }

  async removeFavorite(_userId: string, mentorId: string): Promise<void> {
    await this.toggle(mentorId, "remove")
  }

  async toggleFavorite(userId: string, mentorId: string, isFavorite: boolean): Promise<void> {
    if (isFavorite) {
      await this.removeFavorite(userId, mentorId)
    } else {
      await this.addFavorite(userId, mentorId)
    }
  }

  private async toggle(mentorId: string, action: "add" | "remove"): Promise<void> {
    const res = await fetch("/api/me/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mentorId, action }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.error || "Erro ao atualizar favoritos")
    }
  }
}

export const favoritesService = new FavoritesService()
