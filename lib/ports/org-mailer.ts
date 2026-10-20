/**
 * Camada 6 · Port (e-mails de organização)
 * Regra: o que o service precisa para avisar alguém, sem saber de Brevo. Só os
 * métodos que algum service já usa; os de convite e aprovação entram junto com
 * o service de administração da org.
 * Não faz: montar HTML (isso é do adapter/`lib/email`).
 * Tradeoff: uma interface a mais para testar "avisou os admins certos" sem rede
 * e para trocar de provedor mexendo só no adapter.
 */
import type { PlatformRole } from "@/lib/domain/organizations/organization.entity"

export interface JoinRequestNotice {
  adminEmail: string
  requesterName: string
  requesterEmail: string
  orgName: string
  /** Muda o texto: "(mentor)" ou "(mentorado)" depois do nome. */
  requesterRole: PlatformRole | null
}

export interface OrgMailer {
  /** Avisa um admin da org de um pedido para entrar. Falha de envio é do adapter, nunca derruba o pedido. */
  sendJoinRequest(notice: JoinRequestNotice): Promise<void>
}
