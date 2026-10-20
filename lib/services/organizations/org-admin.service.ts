/**
 * Camada 7 · Service (administração dos membros da org)
 * Regra: a máquina de estados do lado do admin: convidar (conta inexistente,
 * já ativa, já convidada ou com pedido pendente), aprovar pedido, remover
 * vínculo e mudar a política de entrada. Quem chama já passou pelo guard
 * `requireOrgAdmin`; o `adminId` vem da sessão, nunca do corpo da requisição.
 * O único privilégio extra (achar conta por e-mail) passa por `OrgDirectory`
 * (ADR 0008, E4).
 * Não faz: HTTP, mensagens para a tela (a rota traduz o resultado), criar
 * client nem checar permissão (é do guard).
 * Tradeoff: o resultado é uma união (`kind`) em vez de exceção, porque "conta
 * inexistente" e "último admin" são respostas normais. E-mail é aviso: falhou,
 * a operação já gravada continua valendo.
 */
import type { JoinPolicy, PlatformRole } from "@/lib/domain/organizations/organization.entity"
import type { OrgDirectory } from "@/lib/ports/org-directory"
import type { OrgMailer, OrgRecipientNotice } from "@/lib/ports/org-mailer"
import type { OrganizationsRepository } from "@/lib/repositories/organizations.repository"

export type InviteOutcome =
  | { kind: "no_account" }
  | { kind: "already_active" }
  | { kind: "reinvited" }
  | { kind: "approved" }
  | { kind: "invited" }

export type ApproveOutcome = { kind: "approved" } | { kind: "not_found" }

export type RemoveOutcome = { kind: "removed" } | { kind: "self" } | { kind: "last_admin" }

export interface OrgAdminServiceDeps {
  /** Client do usuário (RLS). */
  repo: OrganizationsRepository
  /** Acesso privilegiado só para achar conta por e-mail (ADR 0008, E4). */
  directory: OrgDirectory
  mailer: OrgMailer
  /** Papel de plataforma da pessoa, só para escolher o texto do e-mail. */
  platformRoleOf: (userId: string) => Promise<PlatformRole | null>
}

export function createOrgAdminService(deps: OrgAdminServiceDeps) {
  async function orgNameOf(organizationId: string): Promise<string> {
    return (await deps.repo.findById(organizationId))?.name ?? "a organização"
  }

  /** Monta o destinatário do aviso; mentorado é o texto padrão quando a pessoa não tem papel. */
  async function recipient(
    organizationId: string,
    person: { id: string; name: string; email: string }
  ): Promise<OrgRecipientNotice> {
    const [orgName, role] = await Promise.all([orgNameOf(organizationId), deps.platformRoleOf(person.id)])
    return { name: person.name, email: person.email, orgName, recipientRole: role ?? "mentee" }
  }

  /** Envio é melhor esforço: o vínculo já foi gravado, então nenhuma falha aqui o desfaz. */
  async function notify(send: (mailer: OrgMailer) => Promise<void>) {
    try {
      await send(deps.mailer)
    } catch (error) {
      console.warn("[org-admin.notify]", error instanceof Error ? error.message : error)
    }
  }

  return {
    /**
     * Convida uma conta existente pelo e-mail. Quem já pediu para entrar é
     * aprovada no ato; quem já foi convidada recebe o convite de novo.
     */
    async invite(organizationId: string, email: string): Promise<InviteOutcome> {
      const account = await deps.directory.findAccountByEmail(email)
      if (!account) return { kind: "no_account" }

      const person = { id: account.id, name: account.full_name || account.email, email: account.email }
      const current = (await deps.repo.findMemberState(organizationId, account.id))?.status ?? null

      if (current === "active") return { kind: "already_active" }

      if (current === "invited") {
        await notify(async mailer => mailer.sendInvite(await recipient(organizationId, person)))
        return { kind: "reinvited" }
      }

      if (current === "requested") {
        const approved = await deps.repo.approveRequest(organizationId, account.id)
        if (!approved) return { kind: "already_active" }
        await notify(async mailer => mailer.sendApproved(await recipient(organizationId, person)))
        return { kind: "approved" }
      }

      await deps.repo.inviteMember(organizationId, account.id)
      await notify(async mailer => mailer.sendInvite(await recipient(organizationId, person)))
      return { kind: "invited" }
    },

    /** Aprova um pedido pendente. Sem pedido (ou já tratado) é `not_found`. */
    async approve(organizationId: string, userId: string): Promise<ApproveOutcome> {
      const contact = await deps.repo.approveRequest(organizationId, userId)
      if (!contact) return { kind: "not_found" }

      if (contact.email) {
        const email = contact.email
        await notify(async mailer =>
          mailer.sendApproved(await recipient(organizationId, { id: userId, name: contact.full_name || email, email }))
        )
      }
      return { kind: "approved" }
    },

    /**
     * Remove um membro, recusa um pedido ou cancela um convite. Não deixa o
     * admin remover a si mesmo (o caminho é sair pelo perfil) nem o último
     * admin ativo, que deixaria a org sem ninguém para geri-la.
     */
    async remove(adminId: string, organizationId: string, userId: string): Promise<RemoveOutcome> {
      if (userId === adminId) return { kind: "self" }

      const target = await deps.repo.findMemberState(organizationId, userId)
      if (target?.role === "admin" && target.status === "active") {
        if ((await deps.repo.countActiveAdmins(organizationId)) <= 1) return { kind: "last_admin" }
      }

      await deps.repo.removeMembership(organizationId, userId)
      return { kind: "removed" }
    },

    /** Muda a política de entrada (`open` ou `invite_only`) e devolve a org atualizada. */
    updateJoinPolicy(organizationId: string, joinPolicy: JoinPolicy) {
      return deps.repo.updateJoinPolicy(organizationId, joinPolicy)
    },
  }
}

export type OrgAdminService = ReturnType<typeof createOrgAdminService>
