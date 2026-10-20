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
import type { Database, Tables } from "@/lib/types/supabase"
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

export type AdminRetentionReadRepository = ReturnType<typeof createAdminRetentionReadRepository>
export type AdminRetentionWriteRepository = ReturnType<typeof createAdminRetentionWriteRepository>
