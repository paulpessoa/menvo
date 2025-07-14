"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

interface VolunteerActivity {
  id: string
  user_id: string
  title: string
  activity_type: string
  description?: string
  hours: number
  date: string
  location?: string
  organization?: string
  evidence_url?: string
  status: "pending" | "validated" | "rejected"
  validated_by?: string
  validated_at?: string
  validation_notes?: string
  created_at: string
  updated_at: string
  profiles?: {
    full_name: string
    email: string
  }
}

interface CheckinData {
  title: string
  activity_type: string
  description?: string
  hours: number
  date: string
  location?: string
  organization?: string
  evidence_url?: string
}

export function useVolunteerActivities({ user_only = false }: { user_only?: boolean } = {}) {
  return useQuery({
    queryKey: ["volunteer-activities", { user_only }],
    queryFn: async (): Promise<VolunteerActivity[]> => {
      const params = new URLSearchParams()
      if (user_only) params.set("user_only", "true")

      const response = await fetch(`/api/volunteers/checkin?${params}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao buscar atividades")
      }

      return response.json()
    },
  })
}

export function useCreateVolunteerActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CheckinData) => {
      const response = await fetch("/api/volunteers/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error)
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-activities"] })
    },
  })
}

export function useValidateActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      activity_id,
      status,
      notes,
    }: {
      activity_id: string
      status: "validated" | "rejected"
      notes?: string
    }) => {
      const response = await fetch("/api/volunteers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity_id, status, notes }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error)
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-activities"] })
    },
  })
}
