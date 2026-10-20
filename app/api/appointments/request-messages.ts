/**
 * Camada 8 · textos das recusas de um pedido de mentoria
 * Regra: `/schedule` e `/create` respondem com formatos diferentes, mas a mesma
 * recusa tem o mesmo texto nas duas, então ele mora num lugar só. O formato
 * (status, `code`, envelope) continua em cada rota.
 */
export const REQUEST_MESSAGES = {
  pendingCheckin: "Conte se a sua última mentoria aconteceu antes de agendar outra.",
  selfBooking: "Você não pode agendar uma mentoria consigo mesmo",
  mentorNotFound: "Mentor not found",
  mentorNotVerified: "Mentor is not verified",
  slotTaken: "Este horário acabou de ser reservado. Por favor, escolha outro horário.",
} as const
