"use client"

import { useQueryClient } from "@tanstack/react-query"
import { runEffects } from "@/lib/query/effects"
import { appointmentsEffects } from "@/lib/query/effects/appointments"

/**
 * Refresca todas as listas de sessões depois de uma ação feita por um
 * componente que ainda chama a rota sozinho (confirmar, concluir, avaliar).
 * Some quando esses botões migrarem para as mutations do domínio.
 */
export function useInvalidateAppointments() {
  const qc = useQueryClient()
  return () => runEffects(qc, appointmentsEffects["appointments.confirm"]())
}
