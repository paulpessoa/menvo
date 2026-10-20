"use client"

import { useQuery } from "@tanstack/react-query"
import { getJson } from "@/lib/query/http"
import { appointmentsKeys } from "@/lib/query/keys/appointments"
import { availabilityResponseSchema } from "@/lib/schemas/appointment-responses"

interface MentorAvailabilityOptions {
  /** `YYYY-MM-DD`; omitted, the route uses today. */
  startDate?: string
  /** `YYYY-MM-DD`; omitted, the route uses the next 7 days. */
  endDate?: string
  enabled?: boolean
}

/**
 * Free slots of a mentor, read from the public availability route.
 *
 * Why no cache window: the route already subtracts booked sessions and Google
 * busy time, so a stale list would offer a taken slot. `staleTime: 0` plus the
 * `["appointments"]` invalidation after any booking keeps it honest.
 */
export function useMentorAvailability(mentorId: string, options: MentorAvailabilityOptions = {}) {
  const { startDate, endDate, enabled = true } = options
  return useQuery({
    queryKey: appointmentsKeys.availability(mentorId, { startDate, endDate }),
    queryFn: async () => {
      const params = new URLSearchParams({ mentor_id: mentorId })
      if (startDate) params.set("start_date", startDate)
      if (endDate) params.set("end_date", endDate)
      const res = await getJson(`/api/appointments/availability?${params}`, availabilityResponseSchema)
      return res.availableSlots
    },
    enabled: enabled && !!mentorId,
    staleTime: 0,
    // Failing fast: the screens show a retry button instead of waiting out 3 backoffs.
    retry: false,
  })
}
