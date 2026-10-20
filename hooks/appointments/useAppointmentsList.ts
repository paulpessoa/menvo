"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth"
import { getJson } from "@/lib/query/http"
import { appointmentsKeys } from "@/lib/query/keys/appointments"
import { listAppointmentsResponseSchema } from "@/lib/schemas/appointment-responses"
import type { AppointmentCardData } from "@/components/appointments/appointment-card"

export interface AppointmentsListFilters {
  role?: "mentor" | "mentee"
  status?: "pending" | "confirmed" | "cancelled" | "completed"
  limit?: number
}

/**
 * Lista filtrada de sessões do usuário logado (papel/status/limite opcionais).
 * Existe separado de `useMyAppointments` porque aquele busca todos os status
 * de um papel; este atende telas que pedem um recorte pequeno.
 */
export function useAppointmentsList({ role, status, limit = 10 }: AppointmentsListFilters) {
  const { user, loading } = useAuth()
  return useQuery({
    queryKey: appointmentsKeys.list(user?.id, { role, status, limit }),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (role) params.append("role", role)
      if (status) params.append("status", status)
      params.append("limit", String(limit))
      const res = await getJson(`/api/appointments/list?${params}`, listAppointmentsResponseSchema)
      return res.appointments as unknown as AppointmentCardData[]
    },
    enabled: !loading && !!user,
  })
}
