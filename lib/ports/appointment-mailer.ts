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

export interface AppointmentMailer {
  /** Avisa uma das partes que a sessão foi cancelada, com o motivo. */
  sendCancellation(message: AppointmentCancellationEmail): Promise<void>
  /** Avisa mentor e mentorado que a sessão foi confirmada, com o link do Meet. */
  sendConfirmation(message: AppointmentConfirmationEmail): Promise<void>
}
