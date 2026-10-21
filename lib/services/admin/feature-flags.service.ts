/**
 * Camada 7 · Service das feature flags (admin)
 * Regra: confere `is_admin()` com a sessão (`assertAdmin`) antes de pedir o
 * repository privilegiado (lazy, vindo da composition). Toda mudança grava uma
 * linha em `feature_flag_audit_logs`; a trilha é best-effort (falhar ao gravar
 * não desfaz a mudança, só vai para o log do servidor).
 * Não faz: criar client (é da composition) nem montar resposta HTTP.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, Tables } from "@/lib/types/supabase"
import type { AdminFeatureFlagsRepository } from "@/lib/repositories/admin-ops.repository"
import type { FeatureFlagCreateBody } from "@/lib/schemas/admin"
import { assertAdmin } from "./assert-admin"

const AUDIT_LOG_LIMIT = 20

/** A flag pedida não existe (id errado ou já apagada). */
export class FeatureFlagNotFoundError extends Error {
  readonly status = 404
  constructor() {
    super("Flag não encontrada")
    this.name = "FeatureFlagNotFoundError"
  }
}

export interface AdminFeatureFlagsDeps {
  /** Client da sessão de quem chama (nunca o `service_role`). */
  sessionDb: SupabaseClient<Database>
  /** Lazy: o client privilegiado só nasce depois do `assertAdmin`. */
  repo: () => AdminFeatureFlagsRepository
}

/**
 * Cria o service de feature flags do admin.
 *
 * @param deps sessão para o `assertAdmin` e repository privilegiado lazy.
 */
export function createAdminFeatureFlagsService(deps: AdminFeatureFlagsDeps) {
  async function audit(
    repo: AdminFeatureFlagsRepository,
    adminId: string,
    flagName: string,
    action: string
  ) {
    try {
      await repo.addAuditLog({ flag_name: flagName, action, performed_by: adminId })
    } catch (error) {
      console.error("[admin feature-flags] falha ao gravar auditoria:", error)
    }
  }

  return {
    /**
     * Flags e as últimas 20 linhas da trilha.
     *
     * @throws {AdminForbiddenError} se quem chama não for admin.
     */
    async listFlagsWithLogs() {
      await assertAdmin(deps.sessionDb)
      const repo = deps.repo()
      const [flags, logs] = await Promise.all([
        repo.listFlags(),
        repo.listAuditLogs(AUDIT_LOG_LIMIT)
      ])
      return { flags, logs }
    },

    /** Cria a flag desligada e audita. */
    async createFlag(
      adminId: string,
      input: FeatureFlagCreateBody
    ): Promise<Tables<"feature_flags">> {
      await assertAdmin(deps.sessionDb)
      const repo = deps.repo()
      const flag = await repo.createFlag({
        name: input.name,
        description: input.description ?? null,
        tags: input.tags ?? null
      })
      await audit(repo, adminId, flag.name, "Criada")
      return flag
    },

    /**
     * Liga/desliga e audita com o nome vindo do banco (não do corpo).
     *
     * @throws {FeatureFlagNotFoundError} se o id não existe.
     */
    async setFlagEnabled(adminId: string, id: number, enabled: boolean): Promise<void> {
      await assertAdmin(deps.sessionDb)
      const repo = deps.repo()
      const flag = await repo.setEnabled(id, enabled)
      if (!flag) throw new FeatureFlagNotFoundError()
      await audit(repo, adminId, flag.name, enabled ? "Ativada" : "Desativada")
    },

    /**
     * Apaga a flag e audita.
     *
     * @throws {FeatureFlagNotFoundError} se o id não existe.
     */
    async deleteFlag(adminId: string, id: number): Promise<void> {
      await assertAdmin(deps.sessionDb)
      const repo = deps.repo()
      const flag = await repo.deleteFlag(id)
      if (!flag) throw new FeatureFlagNotFoundError()
      await audit(repo, adminId, flag.name, "Removida")
    }
  }
}

export type AdminFeatureFlagsService = ReturnType<typeof createAdminFeatureFlagsService>
