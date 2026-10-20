/**
 * Camada 10 · Query keys (appointments)
 * Regra: só chaves do domínio appointments, todas começando por `["appointments"]`.
 * Os hooks importam este arquivo direto; a linha em `lib/query/keys.ts` é pedido ao orquestrador.
 */
export const appointmentsKeys = {
  all: ["appointments"] as const,
  /** Sessões em que a pessoa tem o papel `role`, todos os status de uma vez (tela de mentoria). */
  mine: (role: string, userId: string | undefined) => ["appointments", "mine", role, userId] as const,
  /** Lista filtrada por papel/status/limite (componente de lista simples). */
  list: (userId: string | undefined, filters: { role?: string; status?: string; limit: number }) =>
    ["appointments", "list", userId, filters] as const,
  /** Horários livres de um mentor na janela pedida (sem datas = janela padrão da rota). */
  availability: (mentorId: string, range: { startDate?: string; endDate?: string }) =>
    ["appointments", "availability", mentorId, range] as const,
} as const
