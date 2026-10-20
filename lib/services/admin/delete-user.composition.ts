/**
 * Camada 7 · Composição da remoção de conta
 * Regra: o único lugar que cria o client `service_role` para apagar uma conta
 * (ADR 0009, exceção E7: `auth.admin.deleteUser` só existe na Admin API). A
 * rota admin chama `buildAdminDeleteUser` com o client da sessão; o service
 * confere `assertAdmin` antes de pedir o client privilegiado.
 * Não faz: regra de negócio (é do service) nem conferir admin.
 * Tradeoff: o client é lazy (nasce na primeira escrita, depois do
 * `assertAdmin`), então o build roda sem segredos.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createServiceRoleClient, ensureServerSide } from "@/lib/utils/supabase/service-role"
import { createAdminDeleteUser, deleteUserWithClient } from "./delete-user.service"

/** Remoção pelo painel admin: `(actorId, targetId) => resultado`. */
export function buildAdminDeleteUser(session: SupabaseClient<Database>) {
  let privileged: SupabaseClient<Database> | null = null
  const getPrivileged = () => {
    ensureServerSide()
    return (privileged ??= createServiceRoleClient() as SupabaseClient<Database>)
  }

  return createAdminDeleteUser({
    session,
    deleteUser: (userId, options) => deleteUserWithClient(getPrivileged(), userId, options),
  })
}
