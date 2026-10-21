/**
 * Camada 7 · Composição dos usuários no painel admin
 * Regra: o único lugar que escolhe as implementações reais e cria o client
 * `service_role` (ADR 0009, exceção E7: a coluna `mentee_profiles.cv_url` não
 * tem grant para `authenticated`; `profiles` não tem policy de escrita de
 * admin). A rota só chama `buildAdminUsersService` com o client da sessão;
 * lista, `mentee_profiles` e papéis passam pela sessão (RLS `is_admin()`) e só
 * a escrita de `profiles` e o currículo usam o privilegiado.
 * Não faz: regra de negócio (é do service) nem conferir admin.
 * Tradeoff: o client privilegiado é lazy (nasce na primeira leitura de
 * currículo, depois do `assertAdmin`); o build roda sem segredos.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import {
  createAdminProfileWriter,
  createAdminUserAccessWriter,
  createAdminUserCvReader,
  createAdminUsersReader,
} from "@/lib/repositories/admin-users.repository"
import { createRolesCatalog } from "@/lib/repositories/user-roles.repository"
import { logAdminAction } from "@/lib/audit-logger"
import { createAdminUsersService } from "./users/users.service"

export function buildAdminUsersService(session: SupabaseClient<Database>) {
  let privileged: SupabaseClient<Database> | null = null
  const getPrivileged = () => (privileged ??= createServiceRoleClient() as SupabaseClient<Database>)

  return createAdminUsersService({
    session,
    users: createAdminUsersReader(session),
    cv: createAdminUserCvReader(getPrivileged),
    profiles: createAdminProfileWriter(getPrivileged),
    access: createAdminUserAccessWriter(session),
    roles: createRolesCatalog(session),
    audit: logAdminAction,
  })
}
