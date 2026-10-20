"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth"
import { getJson } from "@/lib/query/http"
import { appointmentsKeys } from "@/lib/query/keys/appointments"
import { listAppointmentsResponseSchema } from "@/lib/schemas/appointment-responses"
import type { AppointmentCardData } from "@/components/appointments/appointment-card"
import type { Perspective } from "@/lib/mentorship/group-appointments"

/** Upper bound per perspective - history beyond this isn't useful on this screen. */
const FETCH_LIMIT = 100

/**
 * All appointments where the current user plays `role`, in one request.
 *
 * Why one request instead of one per status: the screen groups by derived
 * lifecycle (action / upcoming / history), which needs every status at once.
 * Response is validated against the route's output schema, so a contract drift
 * becomes a visible error instead of a broken card.
 */
export function useMyAppointments(role: Perspective, enabled = true) {
  const { user, loading } = useAuth()
  return useQuery({
    queryKey: appointmentsKeys.mine(role, user?.id),
    queryFn: async () => {
      const res = await getJson(`/api/appointments/list?role=${role}&limit=${FETCH_LIMIT}`, listAppointmentsResponseSchema)
      return res.appointments as unknown as AppointmentCardData[]
    },
    enabled: enabled && !loading && !!user,
    staleTime: 30_000,
  })
}
