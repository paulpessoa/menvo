"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { runEffects } from "@/lib/query/effects"
import { appointmentsEffects } from "@/lib/query/effects/appointments"
import { postJson } from "@/lib/query/http"
import { appointmentSuccessSchema } from "@/lib/schemas/appointment-responses"

/**
 * Mentor encerra a sessão (`mark-completed`). As listas são rebuscadas antes de a
 * mutation resolver; a recusa da rota chega como `ApiClientError` com a mensagem dela.
 */
export function useCompleteAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { appointmentId: string | number }) =>
      postJson("/api/appointments/mark-completed", input, appointmentSuccessSchema),
    onSuccess: () => runEffects(qc, appointmentsEffects["appointments.complete"]()),
  })
}
