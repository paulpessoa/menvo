/**
 * Camada 7 · Composição das candidaturas de mentor no painel admin
 * Regra: o único lugar que escolhe as implementações reais e cria o client
 * `service_role` (ADR 0009, exceção E7: `profiles` sem policy de escrita de
 * admin, `mentor_profiles` sem grant para usuário comum, `user_roles` fechada
 * para escrita comum, `mentee_profiles.cv_url` sem grant de leitura). A rota só
 * chama os `build*` com o client da sessão; filas e catálogo de papéis passam
 * pela sessão (RLS `is_admin()`) e o chat sai pela sessão para aparecer como o
 * admin.
 * Não faz: regra de negócio nem conferir admin (é do service).
 * Tradeoff: o client privilegiado é lazy (nasce na primeira leitura ou escrita
 * privilegiada, depois do `assertAdmin`); o build roda sem segredos.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import {
  createAdminMentorApplicationsReader,
  createAdminMentorsReader,
} from "@/lib/repositories/admin-mentor-verification.repository"
import { createAdminUserCvReader } from "@/lib/repositories/admin-users.repository"
import { createMentorVerificationListService } from "./verification-list.service"

function lazyPrivileged() {
  let privileged: SupabaseClient<Database> | null = null
  return () => (privileged ??= createServiceRoleClient() as SupabaseClient<Database>)
}

export function buildMentorVerificationListService(session: SupabaseClient<Database>) {
  const getPrivileged = lazyPrivileged()
  return createMentorVerificationListService({
    session,
    applications: createAdminMentorApplicationsReader(session),
    mentors: createAdminMentorsReader(session),
    cv: createAdminUserCvReader(getPrivileged),
  })
}
