/**
 * Camada 7 · Service da retenção LGPD (admin)
 * Regra: confere `is_admin()` com a sessão (`assertAdmin`) antes de qualquer
 * leitura ou escrita; as leituras usam a sessão (policies de admin), só a
 * isenção usa o client privilegiado, pedido de forma preguiçosa.
 * Não faz: criar client (é da composition) nem montar resposta HTTP.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import type {
  AdminRetentionReadRepository,
  AdminRetentionWriteRepository
} from "@/lib/repositories/admin-ops.repository"
import { assertAdmin } from "./assert-admin"

export interface AdminRetentionDeps {
  /** Client da sessão de quem chama (nunca o `service_role`). */
  sessionDb: SupabaseClient<Database>
  reads: AdminRetentionReadRepository
  /** Lazy: o client privilegiado só nasce depois do `assertAdmin`. */
  writes: () => AdminRetentionWriteRepository
  /** Grava a trilha de auditoria (nunca derruba a operação principal). */
  audit: (adminId: string, details: Record<string, unknown>, targetUserId: string) => Promise<void>
}

/**
 * Cria o service de retenção do admin.
 *
 * @param deps portas de leitura, escrita e auditoria, montadas na composition.
 */
export function createAdminRetentionService(deps: AdminRetentionDeps) {
  return {
    /**
     * Fila de retenção e fila de inativos com os números dos cards. Os
     * estágios seguem a mesma definição do overview (`retentionStages`).
     *
     * @throws {AdminForbiddenError} se quem chama não for admin.
     */
    async getRetentionOverview() {
      await assertAdmin(deps.sessionDb)
      const [queue, inactiveQueue] = await Promise.all([
        deps.reads.listRetentionQueue(),
        deps.reads.listInactiveQueue()
      ])

      const stats = { enrolled: 0, noticed30d: 0, noticed1d: 0, optedOut: 0 }
      for (const row of queue) {
        if (row.profile.email_opt_out_at) stats.optedOut++
        else if (row.notice_1d_sent_at) stats.noticed1d++
        else if (row.notice_30d_sent_at) stats.noticed30d++
        else stats.enrolled++
      }

      const inactiveStats = { enrolled: 0, noticed30d: 0 }
      for (const row of inactiveQueue) {
        if (row.notice_30d_sent_at) inactiveStats.noticed30d++
        else inactiveStats.enrolled++
      }

      return { stats, queue, inactiveStats, inactiveQueue }
    },

    /**
     * Isenta um usuário da exclusão de importados: muda a origem para `menvo`
     * (dados importados preservados) e o tira da fila. A ordem importa: se a
     * 2ª etapa falhar, o usuário já não é tratado como importado.
     *
     * @throws {AdminForbiddenError} se quem chama não for admin.
     */
    async exemptFromRetention(adminId: string, userId: string): Promise<void> {
      await assertAdmin(deps.sessionDb)
      const writes = deps.writes()
      await writes.markAsNativeUser(userId)
      await writes.removeFromRetentionQueue(userId)
      await deps.audit(adminId, { reason: "retention_exempt" }, userId)
    }
  }
}

export type AdminRetentionService = ReturnType<typeof createAdminRetentionService>
