"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { runEffects } from "@/lib/query/effects"
import { appointmentsEffects } from "@/lib/query/effects/appointments"
import { postJson } from "@/lib/query/http"
import { confirmResponseSchema } from "@/lib/schemas/appointment-responses"

/**
 * Confirma uma sessão pelo id (painel) ou pelo token do e-mail. A rota decide
 * a regra (inclusive link vencido, 410); o erro chega como `ApiClientError`.
 */
export function useConfirmAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { appointmentId?: string | number; token?: string; mentorNotes?: string }) =>
      postJson("/api/appointments/confirm", input, confirmResponseSchema),
    onSuccess: () => runEffects(qc, appointmentsEffects["appointments.confirm"]()),
  })
}
