/**
 * Camada 7 · Composição do papel mentor/mentee
 * Regra: o ÚNICO lugar das rotas de papel que cria o client `service_role`
 * (ADR 0008, exceção E2, até a RPC `set_my_role`). Ele serve só ao
 * `UserRolesRepository`, que escreve `user_roles`; todo o resto usa o client da
 * sessão e o RLS. As rotas nunca importam `service_role`.
 * Tradeoff: o client privilegiado é criado na primeira escrita e não no import
 * nem no começo do pedido: o build roda sem segredos, e um pedido que falha
 * antes de trocar o papel nem chega a abri-lo.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { createAccountRoleRepository } from "@/lib/repositories/account-role.repository"
import { createMentorRequestRepository } from "@/lib/repositories/mentor-request.repository"
import { createRolesCatalog, createUserRolesRepository } from "@/lib/repositories/user-roles.repository"
import { brevoProfileMailer } from "@/lib/ports/adapters/profile-mailer.brevo"
import { createAccountRoleService } from "./account-role.service"

export function buildAccountRoleService(supabase: SupabaseClient<Database>) {
  let admin: SupabaseClient<Database> | null = null
  const getAdmin = () => (admin ??= createServiceRoleClient() as SupabaseClient<Database>)

  return createAccountRoleService({
    profile: createAccountRoleRepository(supabase),
    verification: createMentorRequestRepository(supabase),
    catalog: createRolesCatalog(supabase),
    userRoles: createUserRolesRepository(getAdmin),
    mailer: brevoProfileMailer,
  })
}
