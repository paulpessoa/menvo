/**
 * Camada 6 · Port (e-mails do painel admin)
 * Regra: o que os services de convites e de e-mails do admin precisam do
 * serviço de e-mail, sem saber de Brevo: enviar o convite de reengajamento,
 * enviar um e-mail de teste e renderizar as prévias.
 * Não faz: decidir quem recebe nem conferir permissão (é do service).
 * Tradeoff: uma interface a mais para testar "mandou para a pessoa certa" e
 * "não renderizou nada para quem não é admin" sem mockar o módulo de e-mail
 * inteiro. Tudo é assíncrono porque o adapter carrega o módulo sob demanda.
 */
export interface ReengagementInviteEmail {
  name: string
  email: string
  subject: string
  bodyText: string
  inviteUrl: string
}

/** Resultado de um envio: o provedor devolve `success: false` em vez de lançar. */
export interface EmailSendResult {
  success: boolean
  error?: string
}

export interface AdminEmailPort {
  /** Envia o convite de reengajamento a uma pessoa. */
  sendReengagementInvite(input: ReengagementInviteEmail): Promise<EmailSendResult>
  /** HTML do convite com os dados dados, o mesmo que o envio real monta. */
  renderReengagementPreview(input: {
    name: string
    bodyText: string
    inviteUrl: string
  }): Promise<string>
  /** HTML de um modelo de e-mail da plataforma, com dados de exemplo. */
  renderTemplatePreview(templateKey: string): Promise<string>
  /** Envia o modelo, com dados de exemplo, para um endereço de teste. */
  sendTestEmail(input: { to: string; templateKey: string }): Promise<EmailSendResult>
}
