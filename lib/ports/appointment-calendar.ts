/**
 * Camada 6 · Port (calendário da sessão)
 * Regra: o que o service de appointments precisa do calendário externo, sem
 * saber que é o Google Calendar.
 * Não faz: decidir quando remover o evento (é do service).
 * Tradeoff: uma interface a mais para testar "cancelou e removeu o evento" sem
 * mockar `googleapis`. Só `deleteEvent` por enquanto; criar o evento entra com a
 * rota de confirmação, que é quem o usa.
 */
export interface AppointmentCalendar {
  /** Remove o evento (liberando a agenda e avisando os convidados). Ignora "já não existe". */
  deleteEvent(userId: string, eventId: string): Promise<void>
}
