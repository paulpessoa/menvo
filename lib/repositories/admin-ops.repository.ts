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

/** Organização com os vínculos embutidos (uma consulta, sem N+1). */
export type OrganizationWithMembers = Tables<"organizations"> & {
  organization_members: Pick<Tables<"organization_members">, "user_id" | "status">[]
}

/**
 * Organizações vistas pelo admin da plataforma (L2-6). Recebe o client da
 * SESSÃO: as policies de admin de `organizations`/`organization_members` já
 * existem, então não há `service_role` aqui.
 */
export function createAdminOrganizationsRepository(db: Db) {
  return {
    /** Todas as orgs, a mais nova primeiro, com os vínculos para contar no service. */
    async listWithMembers(): Promise<OrganizationWithMembers[]> {
      const { data, error } = await db
        .from("organizations")
        .select("*, organization_members(user_id, status)")
        .order("created_at", { ascending: false })
        .returns<OrganizationWithMembers[]>()
      if (error) throw new RepositoryError("admin.organizations.list", error)
      return data ?? []
    },

    /** Se já existe org com o slug. */
    async slugExists(slug: string): Promise<boolean> {
      const { data, error } = await db
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .maybeSingle()
      if (error) throw new RepositoryError("admin.organizations.slugExists", error)
      return data !== null
    },

    /** Cria a org e devolve a linha. */
    async create(input: TablesInsert<"organizations">): Promise<Tables<"organizations">> {
      const { data, error } = await db.from("organizations").insert(input).select().single()
      if (error) throw new RepositoryError("admin.organizations.create", error)
      return data
    },

    /** Suspende/reativa. Devolve a linha, ou `null` se o id não existe. */
    async setStatus(
      id: string,
      status: "active" | "suspended"
    ): Promise<Tables<"organizations"> | null> {
      const { data, error } = await db
        .from("organizations")
        .update({ status })
        .eq("id", id)
        .select()
        .maybeSingle()
      if (error) throw new RepositoryError("admin.organizations.setStatus", error)
      return data
    },

    /** Id da conta pelo e-mail, ou `null`. */
    async findProfileIdByEmail(email: string): Promise<string | null> {
      const { data, error } = await db
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle()
      if (error) throw new RepositoryError("admin.organizations.findProfile", error)
      return data?.id ?? null
    },

    /** Promove um vínculo que já existe para `admin`. */
    async promoteMemberToAdmin(organizationId: string, userId: string): Promise<void> {
      const { error } = await db
        .from("organization_members")
        .update({ role: "admin" })
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
      if (error) throw new RepositoryError("admin.organizations.promote", error)
    },

    /** Cria o vínculo já como `admin`. */
    async addAdminMember(organizationId: string, userId: string): Promise<void> {
      const { error } = await db
        .from("organization_members")
        .insert({ organization_id: organizationId, user_id: userId, role: "admin" })
      if (error) throw new RepositoryError("admin.organizations.addAdmin", error)
    }
  }
}

/** Pedidos de organização (`organization_leads`) vistos pelo admin, pela sessão (L2-6). */
export function createAdminOrgLeadsRepository(db: Db) {
  return {
    /** Leads, do mais novo ao mais antigo; `status` filtra quando vem. */
    async list(status?: string): Promise<Tables<"organization_leads">[]> {
      let query = db
        .from("organization_leads")
        .select("*")
        .order("created_at", { ascending: false })
      if (status) query = query.eq("status", status)
      const { data, error } = await query
      if (error) throw new RepositoryError("admin.orgLeads.list", error)
      return data ?? []
    },

    /** Muda o status. Devolve a linha, ou `null` se o id não existe. */
    async setStatus(id: string, status: string): Promise<Tables<"organization_leads"> | null> {
      const { data, error } = await db
        .from("organization_leads")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .maybeSingle()
      if (error) throw new RepositoryError("admin.orgLeads.setStatus", error)
      return data
    }
  }
}

/** Dados do perfil que o convite de reengajamento usa. */
export type InviteProfileRow = Pick<Tables<"profiles">, "id" | "email" | "full_name">

/**
 * Escritas e leituras do envio de convites (L2-7). Pede client privilegiado:
 * lê `profiles` de quem não é o admin e escreve `import_records`, que só
 * aceita `service_role` por desenho (exceção E7 do ADR 0008/0009).
 */
export function createAdminInvitesRepository(db: Db) {
  return {
    /** Perfis dos ids dados, numa consulta só (sem N+1). */
    async findProfilesByIds(ids: string[]): Promise<InviteProfileRow[]> {
      const { data, error } = await db.from("profiles").select("id, email, full_name").in("id", ids)
      if (error) throw new RepositoryError("admin.invites.findProfiles", error)
      return data ?? []
    },

    /**
     * Marca o convite enviado. Upsert só do campo do convite: o merge preserva
     * `origin_platform` e os dados importados se o registro já existir (e cria
     * com origem `menvo` se não).
     */
    async markInviteSent(userId: string): Promise<void> {
      const { error } = await db
        .from("import_records")
        .upsert({ user_id: userId, invite_sent_at: new Date().toISOString() }, { onConflict: "user_id" })
      if (error) throw new RepositoryError("admin.invites.markSent", error)
    }
  }
}

export type AdminInvitesRepository = ReturnType<typeof createAdminInvitesRepository>
export type AdminOrganizationsRepository = ReturnType<typeof createAdminOrganizationsRepository>
export type AdminOrgLeadsRepository = ReturnType<typeof createAdminOrgLeadsRepository>
export type AdminFeatureFlagsRepository = ReturnType<typeof createAdminFeatureFlagsRepository>
export type AdminRetentionReadRepository = ReturnType<typeof createAdminRetentionReadRepository>
export type AdminRetentionWriteRepository = ReturnType<typeof createAdminRetentionWriteRepository>
