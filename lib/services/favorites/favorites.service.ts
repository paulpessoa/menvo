import { createClient } from "@/lib/utils/supabase/client"

/**
 * Service for user favorite mentors operations.
 */
class FavoritesService {
  private get supabase() {
    return createClient()
  }

  /**
   * Retrieves the list of mentor IDs favorited by the user.
   */
  async getFavorites(userId: string): Promise<string[]> {
    if (!userId) return []
    const { data, error } = await this.supabase
      .from("user_favorites")
      .select("mentor_id")
      .eq("user_id", userId)

    if (error) throw error
    return (data as { mentor_id: string }[])?.map((f) => f.mentor_id) || []
  }

  /**
   * Adds a mentor to the user's favorites.
   */
  async addFavorite(userId: string, mentorId: string): Promise<void> {
    const { error } = await this.supabase
      .from("user_favorites")
      .insert({ user_id: userId, mentor_id: mentorId } as any)

    if (error) throw error
  }

  /**
   * Removes a mentor from the user's favorites.
   */
  async removeFavorite(userId: string, mentorId: string): Promise<void> {
    const { error } = await this.supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("mentor_id", mentorId)

    if (error) throw error
  }

  /**
   * Toggles favorite status for a mentor.
   */
  async toggleFavorite(userId: string, mentorId: string, isFavorite: boolean): Promise<void> {
    if (isFavorite) {
      await this.removeFavorite(userId, mentorId)
    } else {
      await this.addFavorite(userId, mentorId)
    }
  }
}

export const favoritesService = new FavoritesService()
