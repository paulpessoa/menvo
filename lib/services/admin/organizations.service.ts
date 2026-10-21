/**
 * Camada 7 · Service das organizações e dos pedidos de org (painel admin)
 * Regra: confere `is_admin()` com a sessão (`assertAdmin`) antes de qualquer
 * leitura ou escrita. Tudo roda com a sessão do admin (as policies de admin de
 * `organizations`, `organization_members` e `organization_leads` existem), sem
 * `service_role`.
 * Não faz: criar client (é da composition) nem montar resposta HTTP.
 * Tradeoff: o resultado de "criar" e "atribuir admin" é uma união (`kind`),
 * porque slug repetido e e-mail sem conta são respostas normais, não falhas.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, Tables } from "@/lib/types/supabase"
import type {
  AdminOrganizationsRepository,
  AdminOrgLeadsRepository
} from "@/lib/repositories/admin-ops.repository"
import type { OrganizationsRepository } from "@/lib/repositories/organizations.repository"
import type { CreateOrganizationInput } from "@/lib/schemas/organizations"
import { assertAdmin } from "./assert-admin"

/** Org com a contagem de membros ativos (o que a lista do painel mostra). */
export type AdminOrganizationListItem = Tables<"organizations"> & { member_count: number }

export type CreateOrganizationOutcome =
  | { kind: "created"; organization: Tables<"organizations"> }
  | { kind: "slug_taken" }

export type AssignOrgAdminOutcome =
  | { kind: "assigned"; userId: string }
  | { kind: "no_account" }

export interface AdminOrganizationsDeps {
  /** Client da sessão de quem chama (nunca o `service_role`). */
  sessionDb: SupabaseClient<Database>
  repo: AdminOrganizationsRepository
  /** Reuso do repository de organizações para ler o vínculo atual. */
  orgs: Pick<OrganizationsRepository, "findMemberState">
  leads: AdminOrgLeadsRepository
}

/**
 * Cria o service de organizações do admin.
 *
 * @param deps sessão para o `assertAdmin` e os repositories ligados a ela.
 */
export function createAdminOrganizationsService(deps: AdminOrganizationsDeps) {
  return {
    /**
     * Lista as orgs com a contagem de membros ativos (agregado do PostgREST
     * está desligado, então o service conta os vínculos embutidos).
     *
     * @throws {AdminForbiddenError} se quem chama não for admin.
     */
    async listOrganizations(): Promise<AdminOrganizationListItem[]> {
      await assertAdmin(deps.sessionDb)
      const rows = await deps.repo.listWithMembers()
      return rows.map(({ organization_members, ...org }) => ({
        ...org,
        member_count: organization_members.filter(m => m.status === "active").length
      }))
    },

    /** Cria a org; slug repetido volta como `slug_taken`. */
    async createOrganization(input: CreateOrganizationInput): Promise<CreateOrganizationOutcome> {
      await assertAdmin(deps.sessionDb)
      if (await deps.repo.slugExists(input.slug)) return { kind: "slug_taken" }
      return { kind: "created", organization: await deps.repo.create(input) }
    },

    /** Suspende ou reativa. Devolve `null` se a org não existe. */
    async setOrganizationStatus(id: string, status: "active" | "suspended") {
      await assertAdmin(deps.sessionDb)
      return deps.repo.setStatus(id, status)
    },

    /**
     * Torna admin da org uma conta existente (pelo e-mail): promove o vínculo
     * que já houver, ou cria um novo já como admin.
     */
    async assignOrgAdmin(organizationId: string, email: string): Promise<AssignOrgAdminOutcome> {
      await assertAdmin(deps.sessionDb)
      const userId = await deps.repo.findProfileIdByEmail(email)
      if (!userId) return { kind: "no_account" }

      if (await deps.orgs.findMemberState(organizationId, userId)) {
        await deps.repo.promoteMemberToAdmin(organizationId, userId)
      } else {
        await deps.repo.addAdminMember(organizationId, userId)
      }
      return { kind: "assigned", userId }
    },

    /** Pedidos de organização, filtrados por status quando vem. */
    async listOrgLeads(status?: string) {
      await assertAdmin(deps.sessionDb)
      return deps.leads.list(status)
    },

    /** Muda o status de um pedido. Devolve `null` se o id não existe. */
    async setOrgLeadStatus(id: string, status: string) {
      await assertAdmin(deps.sessionDb)
      return deps.leads.setStatus(id, status)
    }
  }
}

export type AdminOrganizationsService = ReturnType<typeof createAdminOrganizationsService>
