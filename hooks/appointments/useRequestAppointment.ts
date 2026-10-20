"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { runEffects } from "@/lib/query/effects"
import { appointmentsEffects } from "@/lib/query/effects/appointments"
import { postJson } from "@/lib/query/http"
import { appointmentDataResponseSchema, createResponseSchema } from "@/lib/schemas/appointment-responses"

type RequestBody = Record<string, unknown>

/**
 * Pede uma mentoria. As duas rotas chamam o mesmo use case no servidor e só
 * diferem no formato: `create` (BookingForm) e `schedule` (BookMentorshipModal).
 * 409 (horário tomado, check-in pendente) chega como `ApiClientError`, com o corpo
 * cru em `body` para quem precisa de `details.reason`.
 */
export function useRequestAppointment() {
  const qc = useQueryClient()
  const onSuccess = () => runEffects(qc, appointmentsEffects["appointments.request"]())
  return {
    create: useMutation({
      mutationFn: (body: RequestBody) => postJson("/api/appointments/create", body, createResponseSchema),
      onSuccess,
    }),
    schedule: useMutation({
      mutationFn: (body: RequestBody) => postJson("/api/appointments/schedule", body, appointmentDataResponseSchema),
      onSuccess,
    }),
  }
}
