/**
 * Camada 7 · Composição do vínculo da pessoa com organizações
 * Regra: o único lugar que escolhe as implementações reais (Supabase, Brevo) e
 * cria o client `service_role` (ADR 0008, regra 1). As rotas só chamam
 * `buildMembershipService`.
 * Não faz: regra de negócio (é do service).
 * Tradeoff: o client privilegiado nasce na primeira vez que alguém o pede, e o
 * Brevo é importado só quando há e-mail a enviar; o build roda sem segredos.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { createOrganizationsRepository } from "@/lib/repositories/organizations.repository"
import { createSupabaseOrgDirectory } from "@/lib/ports/adapters/org-directory.supabase"
import { brevoOrgMailer } from "@/lib/ports/adapters/org-mailer.brevo"
import { getPlatformRole } from "./org-dashboard.service"
import { createMembershipService } from "./membership.service"

export function buildMembershipService(supabase: SupabaseClient<Database>) {
  let admin: SupabaseClient | null = null
  const getAdmin = () => (admin ??= createServiceRoleClient())

  return createMembershipService({
    repo: createOrganizationsRepository(supabase),
    directory: createSupabaseOrgDirectory(getAdmin),
    mailer: brevoOrgMailer,
    platformRoleOf: userId => getPlatformRole(supabase, userId),
  })
}
