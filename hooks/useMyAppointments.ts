import { useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { useAuth } from "@/lib/auth"
import type { AppointmentCardData } from "@/components/appointments/appointment-card"
import type { Perspective } from "@/lib/mentorship/group-appointments"

const participantSchema = z
  .object({ id: z.string(), full_name: z.string().nullable().optional() })
  .passthrough()

// Only the fields the grouping/rendering logic relies on are enforced; the rest
// of the row passes through untouched to AppointmentCard.
const appointmentSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    scheduled_at: z.string(),
    duration_minutes: z.number(),
    status: z.enum(["pending", "confirmed", "cancelled", "completed", "rejected"]),
    mentor: participantSchema.nullable(),
    mentee: participantSchema.nullable(),
    feedbacks: z.array(z.object({ id: z.union([z.string(), z.number()]), reviewer_id: z.string() })).nullable().optional(),
  })
  .passthrough()

const responseSchema = z.object({ appointments: z.array(appointmentSchema) })

/** Upper bound per perspective — history beyond this isn't useful on this screen. */
const FETCH_LIMIT = 100

async function fetchAppointments(role: Perspective): Promise<AppointmentCardData[]> {
  const res = await fetch(`/api/appointments/list?role=${role}&limit=${FETCH_LIMIT}`)
  if (!res.ok) throw new Error("Failed to fetch appointments")
  const parsed = responseSchema.parse(await res.json())
  return parsed.appointments as unknown as AppointmentCardData[]
}

/**
 * All appointments where the current user plays `role`, in one request.
 *
 * Why one request instead of one per status: the screen groups by derived
 * lifecycle (action / upcoming / history), which needs every status at once,
 * and the old per-tab lists fired up to 8 requests on the mentor page.
 */
export function useMyAppointments(role: Perspective, enabled = true) {
  const { user, loading } = useAuth()
  return useQuery({
    queryKey: ["my-appointments", role, user?.id],
    queryFn: () => fetchAppointments(role),
    enabled: enabled && !loading && !!user,
    staleTime: 30_000,
  })
}

/** Refreshes both perspectives after a confirm/cancel/evaluate mutation. */
export function useInvalidateMyAppointments() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ["my-appointments"] })
}
