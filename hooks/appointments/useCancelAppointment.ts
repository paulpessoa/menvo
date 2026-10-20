"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { runEffects } from "@/lib/query/effects"
import { appointmentsEffects } from "@/lib/query/effects/appointments"
import { postJson } from "@/lib/query/http"
import { cancelResponseSchema } from "@/lib/schemas/appointment-responses"

/**
 * Cancela uma sessão com motivo. Ao concluir, as listas são rebuscadas antes
 * de a mutation resolver. Erro é `ApiClientError` com a mensagem da rota.
 */
export function useCancelAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { appointmentId: string | number; reason: string }) =>
      postJson("/api/appointments/cancel", input, cancelResponseSchema),
    onSuccess: () => runEffects(qc, appointmentsEffects["appointments.cancel"]()),
  })
}
