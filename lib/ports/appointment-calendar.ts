/**
 * Camada 6 · Port (calendário da sessão)
 * Regra: o que o service de appointments precisa do calendário externo, sem
 * saber que é o Google Calendar.
 * Não faz: decidir quando criar ou remover o evento (é do service).
 * Tradeoff: uma interface a mais para testar "confirmou e criou o evento" ou
 * "calendário fora do ar não derruba a confirmação" sem mockar `googleapis`.
 * `availability()` é assíncrona porque o adapter carrega o módulo sob demanda.
 */
export interface CalendarEventInput {
  summary: string
  description: string
  startTime: Date
  endTime: Date
  mentorEmail: string
  mentorName: string
  menteeEmail: string
  menteeName: string
}

export interface CreatedCalendarEvent {
  eventId: string
  meetLink: string | null
  calendarLink: string | null
}

export interface AppointmentCalendar {
  /** `configured: false` quando faltam variáveis; `missing` diz quais, para o aviso ao mentor. */
  availability(): Promise<{ configured: boolean; missing: string[] }>
  /** Cria o evento com Google Meet e convida as duas partes. Lança se o calendário falhar. */
  createEvent(input: CalendarEventInput): Promise<CreatedCalendarEvent>
  /** Remove o evento (liberando a agenda e avisando os convidados). Ignora "já não existe". */
  deleteEvent(userId: string, eventId: string): Promise<void>
}
