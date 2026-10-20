/**
 * Camada 7 · Composição do perfil próprio
 * Regra: o único lugar que escolhe o client do banco e como a requisição é
 * autenticada para `/api/profile` e `/api/profile/onboarding`. As rotas só
 * chamam `authenticateRequest`, `buildProfileService` e `buildOnboardingService`.
 * Tradeoff TEMPORÁRIO: o client é `service_role`, como as rotas já eram. Está
 * isolado aqui para o grupo seguinte trocar por RLS (client da sessão) mexendo
 * em um arquivo, depois que o pgTAP provar as policies de escrita própria
 * (docs/blueprint/profile-audit.md, grupo 4). O `Bearer` continua aceito até o
 * Paul decidir (D1); ele é o motivo de validar o token com `service_role`.
 * O client nasce na primeira chamada, nunca no import: `next build` importa as
 * rotas sem as chaves.
 */
import type { SupabaseClient, User } from "@supabase/supabase-js"
import type { NextRequest } from "next/server"
import type { Database } from "@/lib/types/supabase"
import { createClient as createSessionClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { createProfileRepository } from "@/lib/repositories/profile.repository"
import { createOnboardingService } from "./onboarding.service"
import { createProfileService } from "./profile.service"

let adminClient: SupabaseClient<Database> | null = null

/** Client com `service_role`, criado uma vez por instância. */
export function getProfileDbClient(): SupabaseClient<Database> {
  return (adminClient ??= createServiceRoleClient() as SupabaseClient<Database>)
}

export interface AuthenticatedRequest {
  user: User | null
  error: { message: string } | null
}

/** Quem está pedindo: `Authorization: Bearer <token>` se vier, senão a sessão por cookie. */
export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedRequest> {
  const authHeader = request.headers.get("authorization")
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error,
    } = await getProfileDbClient().auth.getUser(token)
    return { user, error }
  }

  const supabase = await createSessionClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return { user, error }
}

export function buildProfileService() {
  return createProfileService({ repo: createProfileRepository(getProfileDbClient()) })
}

export function buildOnboardingService() {
  return createOnboardingService({ repo: createProfileRepository(getProfileDbClient()) })
}
