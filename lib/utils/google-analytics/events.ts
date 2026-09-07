/**
 * Telemetria e rastreamento de eventos GA4 para o Menvo.
 * Focado nas métricas do funil de ativação: Quiz Realizado ➔ Agendamento de Mentoria.
 */

export type GTagEventParams = Record<string, string | number | boolean | undefined | null>

/**
 * Dispara um evento customizado no Google Analytics (GA4) se disponível no navegador.
 */
export function trackEvent(eventName: string, params?: GTagEventParams) {
  if (typeof window === "undefined" || typeof (window as any).gtag !== "function") {
    return
  }
  try {
    (window as any).gtag("event", eventName, params)
  } catch (err) {
    console.warn("[GA4] Erro ao registrar evento:", err)
  }
}

/**
 * Rastreia a conclusão do Quiz de Carreira pelo mentee.
 * Etapa 1 do funil de ativação.
 */
export function trackQuizCompleted(data?: {
  responseId?: string
  email?: string
  hasEvent?: boolean
}) {
  trackEvent("quiz_completed", {
    quiz_id: data?.responseId,
    is_event: data?.hasEvent || false,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Rastreia a confirmação de agendamento de mentoria.
 * Etapa 2 do funil de ativação (conversão final do mentee).
 */
export function trackBookingConfirmed(data?: {
  mentorId?: string
  requestedDate?: string
  requestedTime?: string
  isFirstBooking?: boolean
}) {
  trackEvent("booking_confirmed", {
    mentor_id: data?.mentorId,
    booking_date: data?.requestedDate,
    booking_time: data?.requestedTime,
    is_first_booking: data?.isFirstBooking ?? true,
    timestamp: new Date().toISOString(),
  })
}
