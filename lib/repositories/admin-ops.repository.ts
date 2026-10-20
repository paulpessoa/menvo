/**
 * Camada 5 · Repository do painel admin (linha L2)
 * Regra: único ponto que fala com o banco para as filas de retenção LGPD.
 * Recebe o client por parâmetro: leituras com o da sessão do admin (policies
 * `is_admin()` de `account_retention`, `inactive_accounts_queue` e `profiles`),
 * escritas com o privilegiado, que só a composition cria (ADR 0009).
 * Não faz: regra de negócio nem conferir admin (é do service, `assertAdmin`).
 * Tradeoff: leitura e escrita em fábricas separadas, para o tipo de client
 * (sessão x privilégio) ficar visível em quem chama. Erro do driver vira
 * `RepositoryError`, sem vazar mensagem do banco para a rota.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, Tables, TablesInsert } from "@/lib/types/supabase"
import { RepositoryError } from "./repository-error"

type Db = SupabaseClient<Database>

/** Linha da fila de retenção com o perfil já embutido (uma consulta, sem N+1). */
export type RetentionQueueRow = Tables<"account_retention"> & {
  profile: {
    email: string | null
    full_name: string | null
    email_opt_out_at: string | null
  }
}

/** Linha da fila de contas inativas com o perfil já embutido. */
export type InactiveQueueRow = Tables<"inactive_accounts_queue"> & {
  profile: { email: string | null; full_name: string | null }
}

/** Leituras das filas de retenção, com o client da sessão do admin. */
export function createAdminRetentionReadRepository(db: Db) {
  return {
    /** Fila de importados do JotForm, a mais antiga primeiro. */
    async listRetentionQueue(): Promise<RetentionQueueRow[]> {
      const { data, error } = await db
        .from("account_retention")
        .select("*, profile:profiles!inner(email, full_name, email_opt_out_at)")
        .order("clock_started_at", { ascending: true })
        .returns<RetentionQueueRow[]>()
      if (error) throw new RepositoryError("admin.retention.listQueue", error)
      return data ?? []
    },

    /** Fila de contas sem login, a de exclusão mais próxima primeiro. */
    async listInactiveQueue(): Promise<InactiveQueueRow[]> {
      const { data, error } = await db
        .from("inactive_accounts_queue")
        .select("*, profile:profiles!inner(email, full_name)")
        .order("scheduled_deletion_at", { ascending: true })
        .returns<InactiveQueueRow[]>()
      if (error) throw new RepositoryError("admin.retention.listInactive", error)
      return data ?? []
    }
  }
}

/**
 * Escritas da isenção. Pede client privilegiado: `import_records` só aceita
 * escrita de `service_role` por desenho (exceção E7 do ADR 0008/0009).
 */
export function createAdminRetentionWriteRepository(db: Db) {
  return {
    /** Passa o registro importado a `menvo`, preservando os dados originais. */
    async markAsNativeUser(userId: string): Promise<void> {
      const { error } = await db
        .from("import_records")
        .update({ origin_platform: "menvo", updated_at: new Date().toISOString() })
        .eq("user_id", userId)
      if (error) throw new RepositoryError("admin.retention.markNative", error)
    },

    /** Tira o usuário da fila de retenção. */
    async removeFromRetentionQueue(userId: string): Promise<void> {
      const { error } = await db.from("account_retention").delete().eq("user_id", userId)
      if (error) throw new RepositoryError("admin.retention.removeFromQueue", error)
    }
  }
}

/**
 * Feature flags e a trilha de quem as mexeu (L2-5). Recebe o client
 * privilegiado da composition (exceção E7 por ora: a troca pela sessão espera
 * as policies de admin da M-A2).
 */
export function createAdminFeatureFlagsRepository(db: Db) {
  return {
    /** Todas as flags, em ordem alfabética. */
    async listFlags(): Promise<Tables<"feature_flags">[]> {
      const { data, error } = await db.from("feature_flags").select("*").order("name")
      if (error) throw new RepositoryError("admin.featureFlags.list", error)
      return data ?? []
    },

    /** Últimas linhas da trilha, a mais recente primeiro. */
    async listAuditLogs(limit: number): Promise<Tables<"feature_flag_audit_logs">[]> {
      const { data, error } = await db
        .from("feature_flag_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)
      if (error) throw new RepositoryError("admin.featureFlags.listLogs", error)
      return data ?? []
    },

    /** Cria a flag (desligada) e devolve a linha criada. */
    async createFlag(
      input: Pick<TablesInsert<"feature_flags">, "name" | "description" | "tags">
    ): Promise<Tables<"feature_flags">> {
      const { data, error } = await db
        .from("feature_flags")
        .insert({ ...input, enabled: false })
        .select()
        .single()
      if (error) throw new RepositoryError("admin.featureFlags.create", error)
      return data
    },

    /** Liga/desliga. Devolve a linha, ou `null` se o id não existe. */
    async setEnabled(id: number, enabled: boolean): Promise<Tables<"feature_flags"> | null> {
      const { data, error } = await db
        .from("feature_flags")
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .maybeSingle()
      if (error) throw new RepositoryError("admin.featureFlags.setEnabled", error)
      return data
    },

    /** Apaga a flag. Devolve a linha apagada, ou `null` se o id não existe. */
    async deleteFlag(id: number): Promise<Tables<"feature_flags"> | null> {
      const { data, error } = await db.from("feature_flags").delete().eq("id", id).select().maybeSingle()
      if (error) throw new RepositoryError("admin.featureFlags.delete", error)
      return data
    },

    /** Grava uma linha da trilha. */
    async addAuditLog(entry: TablesInsert<"feature_flag_audit_logs">): Promise<void> {
      const { error } = await db.from("feature_flag_audit_logs").insert(entry)
      if (error) throw new RepositoryError("admin.featureFlags.audit", error)
    }
  }
}

export type AdminFeatureFlagsRepository = ReturnType<typeof createAdminFeatureFlagsRepository>
export type AdminRetentionReadRepository = ReturnType<typeof createAdminRetentionReadRepository>
export type AdminRetentionWriteRepository = ReturnType<typeof createAdminRetentionWriteRepository>
