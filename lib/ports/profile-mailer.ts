/**
 * Camada 6 · Port (e-mails do perfil)
 * Regra: o que os services de perfil precisam avisar por e-mail, sem saber de
 * Brevo. Cada método é fire-and-forget do ponto de vista do chamador: o e-mail
 * não pode derrubar a ação do usuário.
 * Não faz: montar HTML (isso é do adapter/`lib/email`).
 * Tradeoff: uma interface a mais para testar o service sem rede e trocar de
 * provedor mexendo só em `adapters/profile-mailer.brevo.ts`.
 */
export interface NewMentorRequestEmail {
  userName: string
  userEmail: string
  mentorshipApproach: string
  whatToExpect?: string
}

export interface NewMenteeEmail {
  email: string
  name: string
}

export interface ProfileMailer {
  /** Avisa o admin de que alguém pediu para ser mentor. */
  notifyAdminNewMentor(message: NewMentorRequestEmail): Promise<void>
  /** Convida quem acabou de virar mentorado a completar o perfil. */
  notifyNewMentee(message: NewMenteeEmail): Promise<unknown>
}
