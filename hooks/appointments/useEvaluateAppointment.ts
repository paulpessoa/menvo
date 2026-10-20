"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { runEffects } from "@/lib/query/effects"
import { appointmentsEffects } from "@/lib/query/effects/appointments"
import { postJson } from "@/lib/query/http"
import { appointmentSuccessSchema } from "@/lib/schemas/appointment-responses"

/**
 * Mentorado avalia a sessão (`complete`: grava a avaliação e conclui). 409 (já
 * avaliada) e demais recusas chegam como `ApiClientError` com a mensagem da rota.
 */
export function useEvaluateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      appointmentId: string | number
      rating: number
      privateNotes?: string | null
      publicFeedback?: string | null
    }) => postJson("/api/appointments/complete", input, appointmentSuccessSchema),
    onSuccess: () => runEffects(qc, appointmentsEffects["appointments.evaluate"]()),
  })
}
