/**
 * Camada 6 · Port (e-mails de agendamento)
 * Regra: o que o service de appointments precisa para avisar mentor e
 * mentorado, sem saber de Brevo.
 * Não faz: montar HTML (é do adapter e de `lib/email`) nem decidir quem recebe
 * (é do service).
 * Tradeoff: uma interface a mais para testar "mandou o aviso certo, para a
 * pessoa certa" sem mockar o módulo de e-mail inteiro, e para a Tarefa 5
 * (outbox) trocar o envio direto por gravar um evento mexendo só no adapter.
 * Só tem o que os casos de uso migrados usam; os demais e-mails entram com a
 * rota que os usa.
 */
export interface AppointmentCancellationEmail {
  recipientEmail: string
  recipientName: string
  otherPersonName: string
  scheduledAt: string
  reason: string
  cancelledByName: string
}

export interface AppointmentConfirmationEmail {
  mentorEmail: string
  menteeEmail: string
  mentorName: string
  menteeName: string
  scheduledAt: string
  meetLink: string | null
  calendarLink?: string | null
  menteeNotes?: string
  mentorNotes?: string
}

/** Pedido novo para o mentor, com o link de confirmação (`token`). */
export interface AppointmentRequestEmail {
  mentorEmail: string
  mentorName: string
  menteeName: string
  scheduledAt: string
  message: string
  token: string
}

/** Aviso à equipe Menvo de que um pedido entrou. */
export interface AppointmentRequestAdminNotice {
  mentorName: string
  mentorEmail: string
  menteeName: string
  menteeEmail: string
  scheduledAt: string
  notes: string
}

export interface AppointmentMailer {
  /** Avisa o mentor de um pedido novo, com o link para confirmar. */
  sendRequest(message: AppointmentRequestEmail): Promise<void>
  /** Avisa a equipe Menvo de um pedido novo. */
  notifyAdminOfRequest(notice: AppointmentRequestAdminNotice): Promise<void>
  /** Avisa uma das partes que a sessão foi cancelada, com o motivo. */
  sendCancellation(message: AppointmentCancellationEmail): Promise<void>
  /** Avisa mentor e mentorado que a sessão foi confirmada, com o link do Meet. */
  sendConfirmation(message: AppointmentConfirmationEmail): Promise<void>
}
