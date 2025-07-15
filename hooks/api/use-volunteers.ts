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
  status: "pending" | "validated" | "rejected"
  evidence_url?: string
  validator_id?: string
  validated_at?: string
  created_at: string
  updated_at: string
}

interface CreateActivityData {
  title: string
  activity_type: string
  description?: string
  hours: number
  date: string
  evidence_url?: string
}

interface ValidateActivityData {
  activity_id: string
  status: "validated" | "rejected"
  feedback?: string
}

export function useVolunteerActivities(options?: { user_only?: boolean }) {
  return useQuery({
    queryKey: ["volunteer-activities", options],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options?.user_only) {
        params.append("user_only", "true")
      }

      const response = await fetch(`/api/volunteer-activities?${params}`)
      if (!response.ok) {
        throw new Error("Erro ao buscar atividades")
      }
      return response.json() as Promise<VolunteerActivity[]>
    },
  })
}

export function useCreateVolunteerActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateActivityData) => {
      const response = await fetch("/api/volunteer-activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao registrar atividade")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-activities"] })
    },
  })
}

export function useValidateActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ValidateActivityData) => {
      const response = await fetch("/api/volunteer-activities/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao validar atividade")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-activities"] })
    },
  })
}

export function useVolunteerStats() {
  return useQuery({
    queryKey: ["volunteer-stats"],
    queryFn: async () => {
      const response = await fetch("/api/volunteer-activities/stats")
      if (!response.ok) {
        throw new Error("Erro ao buscar estatísticas")
      }
      return response.json()
    },
  })
}
