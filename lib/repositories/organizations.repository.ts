/**
 * Camada 5 · Repository (organizações)
 * Regra: único ponto que fala com o banco para `organizations` e
 * `organization_members`. Recebe o client por parâmetro: o do usuário, com RLS.
 * Não faz: regra de negócio (camada 7), criar client (impede teste e esconde
 * qual permissão está em uso) nem usar `service_role` (o acesso privilegiado
 * da org, quando entrar, fica num port, não aqui).
 * Tradeoff: uma interface a mais em troca de testar o service com um fake e de
 * não deixar `from("organization_members")` espalhado por rotas. Os métodos
 * entram conforme cada camada acima passa a usá-los, para não haver código
 * sem chamador. Erro do driver vira `RepositoryError`; quem prefere degradar
 * (a página pública, por exemplo) captura no service.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import type { JoinPolicy } from "@/lib/domain/organizations/organization.entity"
import { RepositoryError } from "./repository-error"

/** O que a página pública `/o/[slug]` precisa de uma org ativa. */
export interface PublicOrganization {
  slug: string
  name: string
  type: string
  join_policy: JoinPolicy
}

/** Uma org aberta a que um mentor pertence (chip "Mentor da {org}"). */
export interface MentorOrganizationLink {
  user_id: string
  name: string
  slug: string
}

export interface OrganizationsRepository {
  /** Org ativa pelo slug, ou `null`. Suspensa conta como inexistente aqui. */
  findActiveBySlug(slug: string): Promise<PublicOrganization | null>
  /**
   * Vínculos ativos dos mentores dados com orgs ativas de política aberta, em
   * UMA consulta (`in`), para não virar N+1 na lista de mentores.
   */
  listOpenOrganizationLinks(mentorIds: readonly string[]): Promise<MentorOrganizationLink[]>
}

export function createOrganizationsRepository(db: SupabaseClient<Database>): OrganizationsRepository {
  return {
    async findActiveBySlug(slug) {
      const { data, error } = await db
        .from("organizations")
        .select("slug, name, type, join_policy")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle()
      if (error) throw new RepositoryError("organizations.findActiveBySlug", error)
      if (!data) return null
      return { ...data, join_policy: data.join_policy === "invite_only" ? "invite_only" : "open" }
    },

    async listOpenOrganizationLinks(mentorIds) {
      if (mentorIds.length === 0) return []
      // A ordem dos filtros importa só para o teste do service (o último `eq` fecha a cadeia).
      const { data, error } = await db
        .from("organization_members")
        .select("user_id, organizations!inner(name, slug, status, join_policy)")
        .in("user_id", [...mentorIds])
        .eq("status", "active")
        .eq("organizations.status", "active")
        .eq("organizations.join_policy", "open")
      if (error) throw new RepositoryError("organizations.listOpenOrganizationLinks", error)

      const links: MentorOrganizationLink[] = []
      for (const row of data ?? []) {
        // Com `!inner` o embed é um objeto; a tipagem gerada às vezes o anuncia como array.
        const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations
        if (org?.name && org?.slug) links.push({ user_id: row.user_id, name: org.name, slug: org.slug })
      }
      return links
    },
  }
}
