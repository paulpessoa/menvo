/**
 * Camada 7 · Composição do perfil próprio
 * Regra: o único lugar que escolhe o client do banco e como a requisição é
 * autenticada para `/api/profile` e `/api/profile/onboarding`. As rotas só
 * chamam `authenticateRequest`, `buildProfileService` e `buildOnboardingService`.
 * O client é o da SESSÃO (cookie), então toda leitura e escrita passa pelo RLS
 * do dono: o pgTAP/prova em produção mostrou que as policies de escrita própria
 * de `profiles`, `mentor_profiles` e `mentee_profiles` bastam (grupo 4 de
 * docs/blueprint/profile-audit.md). Não há `service_role` nem `Authorization:
 * Bearer` aqui (decisão D1): nenhum chamador usava o token.
 * O client nasce na primeira chamada, nunca no import: `next build` importa as
 * rotas sem as chaves.
 */
import type { SupabaseClient, User } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createClient as createSessionClient } from "@/lib/utils/supabase/server"
import { createProfileRepository } from "@/lib/repositories/profile.repository"
import { createOnboardingService } from "./onboarding.service"
import { createProfileService } from "./profile.service"

export interface AuthenticatedRequest {
  user: User | null
  error: { message: string } | null
  /** Client da sessão do usuário; passe-o aos `build*Service`. */
  db: SupabaseClient<Database>
}

/** Quem está pedindo: a sessão por cookie, junto com o client que respeita o RLS dela. */
export async function authenticateRequest(): Promise<AuthenticatedRequest> {
  const db = (await createSessionClient()) as SupabaseClient<Database>
  const {
    data: { user },
    error,
  } = await db.auth.getUser()
  return { user, error, db }
}

export function buildProfileService(db: SupabaseClient<Database>) {
  return createProfileService({ repo: createProfileRepository(db) })
}

export function buildOnboardingService(db: SupabaseClient<Database>) {
  return createOnboardingService({ repo: createProfileRepository(db) })
}
