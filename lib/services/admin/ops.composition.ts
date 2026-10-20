/**
 * Camada 7 · Composição do painel admin (linha L2)
 * Regra: o único lugar que cria o client `service_role` do painel (ADR 0008 E7,
 * ADR 0009), de forma preguiçosa: só nasce quando o service o pede, depois do
 * `assertAdmin`. As rotas só chamam os `build*`.
 * Não faz: regra de negócio (é dos services).
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { logAdminAction } from "@/lib/audit-logger"
import {
  createAdminRetentionReadRepository,
  createAdminRetentionWriteRepository
} from "@/lib/repositories/admin-ops.repository"
import { getAdminOverview } from "./overview.service"
import { createAdminRetentionService } from "./retention.service"

function lazyPrivilegedClient() {
  let client: SupabaseClient<Database> | null = null
  return () => (client ??= createServiceRoleClient() as SupabaseClient<Database>)
}

/**
 * Visão geral do painel: tudo pela sessão do admin, menos `appointments`, que
 * usa o client privilegiado (lazy, só depois do `assertAdmin`).
 */
export function loadAdminOverview(sessionDb: SupabaseClient<Database>) {
  return getAdminOverview(sessionDb, lazyPrivilegedClient())
}

/** Service de retenção: leituras pela sessão, isenção pelo client privilegiado. */
export function buildAdminRetentionService(sessionDb: SupabaseClient<Database>) {
  const privileged = lazyPrivilegedClient()
  return createAdminRetentionService({
    sessionDb,
    reads: createAdminRetentionReadRepository(sessionDb),
    writes: () => createAdminRetentionWriteRepository(privileged()),
    // O tipo de ação ainda não tem nome próprio (audit-logger é compartilhado).
    audit: (adminId, details, targetUserId) =>
      logAdminAction(adminId, "user_status_changed", details, targetUserId)
  })
}
