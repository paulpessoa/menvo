/**
 * Camada 7 · Service (vínculo da própria pessoa com organizações)
 * Regra: a máquina de estados do lado da pessoa: nada → `requested` (pedir),
 * `invited` → `active` (aceitar), qualquer estado → nada (sair/recusar/cancelar).
 * Quem age é SEMPRE o `actor` que a rota tirou da sessão; nenhum método aceita
 * o id de outra pessoa (ADR 0008, regra 2), e o único privilégio extra (ler os
 * e-mails dos admins) passa por `OrgDirectory`.
 * Não faz: HTTP, mensagens para a tela (a rota traduz o resultado) nem criar
 * client. A org decide quem entra: aprovar é do lado do admin, não deste service.
 * Tradeoff: o resultado é uma união (`kind`) em vez de exceção, porque "org só
 * por convite" e "já faz parte" são respostas normais, não falhas.
 */
import type { PlatformRole } from "@/lib/domain/organizations/organization.entity"
import type { OrgDirectory } from "@/lib/ports/org-directory"
import type { OrgMailer } from "@/lib/ports/org-mailer"
import type { OrganizationsRepository, PersonMembership } from "@/lib/repositories/organizations.repository"

export interface MembershipActor {
  id: string
  /** E-mail da sessão: serve de reserva se o perfil não tiver. */
  email: string | null
}

export type JoinOutcome =
  | { kind: "not_found" }
  | { kind: "already_active" }
  | { kind: "already_requested" }
  | { kind: "accepted"; orgName: string }
  | { kind: "invite_only" }
  | { kind: "requested" }

export interface MembershipServiceDeps {
  /** Client do usuário (RLS). */
  repo: OrganizationsRepository
  /** Acesso privilegiado só para os e-mails dos admins (ADR 0008, E3). */
  directory: OrgDirectory
  mailer: OrgMailer
  /** Papel de plataforma da pessoa, só para escolher o texto do e-mail. */
  platformRoleOf: (userId: string) => Promise<PlatformRole | null>
}

export function createMembershipService(deps: MembershipServiceDeps) {
  /**
   * Avisa os admins de que há um pedido. É melhor esforço: o pedido já foi
   * gravado, então falha ao achar os admins ou ao enviar não pode desfazê-lo.
   */
  async function notifyAdmins(actor: MembershipActor, org: { id: string; name: string }) {
    try {
      const [contact, adminEmails, requesterRole] = await Promise.all([
        deps.repo.findOwnContact(actor.id).catch(() => null),
        deps.directory.listAdminEmails(org.id),
        deps.platformRoleOf(actor.id),
      ])
      const requesterEmail = contact?.email || actor.email || ""
      const requesterName = contact?.full_name || contact?.email || "Alguém"
      await Promise.all(
        adminEmails.map(adminEmail =>
          deps.mailer.sendJoinRequest({ adminEmail, requesterName, requesterEmail, orgName: org.name, requesterRole })
        )
      )
    } catch (error) {
      console.warn("[membership.notifyAdmins]", error instanceof Error ? error.message : error)
    }
  }

  return {
    /** Os vínculos da própria pessoa. */
    listMine(actor: MembershipActor): Promise<PersonMembership[]> {
      return deps.repo.listMembershipsOf(actor.id)
    },

    /**
     * Pede para entrar ou aceita o convite que já existe. Idempotente: quem já é
     * membro ou já pediu recebe o estado atual, sem efeito. Convite vale mesmo
     * em org só por convite; pedido novo não.
     */
    async join(actor: MembershipActor, slug: string): Promise<JoinOutcome> {
      const org = await deps.repo.findJoinTargetBySlug(slug)
      if (!org) return { kind: "not_found" }

      const current = await deps.repo.findMembershipStatus(org.id, actor.id)
      if (current === "active") return { kind: "already_active" }
      if (current === "requested") return { kind: "already_requested" }
      if (current === "invited") {
        await deps.repo.acceptInvite(org.id, actor.id)
        return { kind: "accepted", orgName: org.name }
      }

      if (org.join_policy === "invite_only") return { kind: "invite_only" }

      await deps.repo.requestMembership(org.id, actor.id)
      await notifyAdmins(actor, org)
      return { kind: "requested" }
    },

    /** Sair, recusar convite ou cancelar pedido: apaga o vínculo da própria pessoa. */
    async leave(actor: MembershipActor, organizationId: string): Promise<void> {
      await deps.repo.removeMembership(organizationId, actor.id)
    },
  }
}

export type MembershipService = ReturnType<typeof createMembershipService>
