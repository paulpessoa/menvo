/**
 * Camada 7 · Composição das notificações
 * Regra: escolhe o repository real. Recebe o client da sessão e nunca cria
 * `service_role`.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createMeNotificationsRepository } from "@/lib/repositories/me-notifications.repository"
import { createMyNotificationsService } from "./my-notifications.service"

export function buildMyNotificationsService(supabase: SupabaseClient<Database>) {
  return createMyNotificationsService({ repo: createMeNotificationsRepository(supabase) })
}
