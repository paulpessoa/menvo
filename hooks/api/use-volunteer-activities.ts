import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export interface VolunteerActivity {
  id: string
  user_id: string
  title: string
  activity_type: string
  description?: string
  hours: number
  date: string
  status: "pending" | "validated" | "rejected"
  validated_by?: string
  validated_at?: string
  validation_notes?: string
  created_at: string
  updated_at: string
  user?: {
    full_name: string
    avatar_url?: string
  }
  validator?: {
    full_name: string
  }
}

export interface VolunteerStats {
  total_activities: number
  total_volunteers: number
  total_hours: number
  validated_activities: number
  pending_activities: number
  rejected_activities: number
  activities_by_type: Array<{
    activity_type: string
    count: number
    total_hours: number
  }>
  monthly_stats: Array<{
    month: string
    activities: number
    hours: number
  }>
}

interface VolunteerActivitiesFilters {
  status?: "pending" | "validated" | "rejected"
  user_only?: boolean
}

// Get volunteer activities
export const useVolunteerActivities = (filters: VolunteerActivitiesFilters = {}) => {
  return useQuery({
    queryKey: ["volunteer-activities", filters],
    queryFn: async (): Promise<VolunteerActivity[]> => {
      const params = new URLSearchParams()

      if (filters.status) params.append("status", filters.status)
      if (filters.user_only) params.append("user_only", "true")

      const response = await fetch(`/api/volunteer-activities?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Erro ao buscar atividades de voluntariado")
      }

      const data = await response.json()
      return data.activities || data
    },
  })
}

// Get volunteer statistics (public)
export const useVolunteerStats = () => {
  return useQuery({
    queryKey: ["volunteer-stats"],
    queryFn: async (): Promise<VolunteerStats> => {
      const response = await fetch("/api/volunteer-activities/stats")
      if (!response.ok) {
        throw new Error("Erro ao buscar estatísticas")
      }
      return response.json()
    },
  })
}

// Create volunteer activity
export const useCreateVolunteerActivity = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      title: string
      activity_type: string
      description?: string
      hours: number
      date: string
    }) => {
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
      queryClient.invalidateQueries({ queryKey: ["volunteer-stats"] })
      toast.success("Atividade registrada com sucesso! Aguarde a validação.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar atividade")
    },
  })
}

// Validate activity (admin/moderator)
export const useValidateActivity = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      activityId: string
      status: "validated" | "rejected"
      notes?: string
    }) => {
      const response = await fetch(`/api/volunteer-activities/${data.activityId}/validate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: data.status,
          notes: data.notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao validar atividade")
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-activities"] })
      queryClient.invalidateQueries({ queryKey: ["volunteer-stats"] })
      toast.success(variables.status === "validated" ? "Atividade aprovada com sucesso!" : "Atividade rejeitada.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao validar atividade")
    },
  })
}
