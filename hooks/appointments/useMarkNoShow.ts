"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { runEffects } from "@/lib/query/effects"
import { appointmentsEffects } from "@/lib/query/effects/appointments"
import { postJson } from "@/lib/query/http"
import { appointmentSuccessSchema } from "@/lib/schemas/appointment-responses"

/**
 * Mentor registra a ausência do mentorado. Ao concluir, as listas são rebuscadas;
 * erro é `ApiClientError` com a mensagem da rota.
 */
export function useMarkNoShow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { appointmentId: string | number; notes?: string }) =>
      postJson("/api/appointments/no-show", input, appointmentSuccessSchema),
    onSuccess: () => runEffects(qc, appointmentsEffects["appointments.no-show"]()),
  })
}
