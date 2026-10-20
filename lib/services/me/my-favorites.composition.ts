/**
 * Camada 7 · Composição dos favoritos
 * Regra: escolhe o repository real. Recebe o client da sessão e nunca cria
 * `service_role`.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createFavoritesRepository } from "@/lib/repositories/favorites.repository"
import { createMyFavoritesService } from "./my-favorites.service"

export function buildMyFavoritesService(supabase: SupabaseClient<Database>) {
  return createMyFavoritesService({ repo: createFavoritesRepository(supabase) })
}
