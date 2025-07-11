import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export interface VolunteerActivity {
  id: string
  user_id: string
  date: string
  hours: number
  activity_type: string
  description?: string
  location?: string
  status: "pending" | "validated" | "rejected"
  validated_by?: string
  validated_at?: string
  validation_notes?: string
  created_at: string
  updated_at: string
  profiles?: {
    first_name: string
    last_name: string
    email: string
    avatar_url?: string
  }
  validator?: {
    first_name: string
    last_name: string
  }
}

export interface VolunteerActivityType {
  id: string
  name: string
  description?: string
  is_active: boolean
}

export interface VolunteerStats {
  total_activities: number
  total_volunteers: number
  total_hours: number
  avg_hours_per_activity: number
  validated_activities: number
  pending_activities: number
  rejected_activities: number
  activities_last_30_days: number
  hours_last_30_days: number
  activities_last_7_days: number
  hours_last_7_days: number
}

interface VolunteerActivitiesFilters {
  search?: string
  status?: "pending" | "validated" | "rejected"
  sortBy?: "date" | "hours" | "name"
  sortOrder?: "asc" | "desc"
  userOnly?: boolean
}

// Get volunteer activity types
export const useVolunteerActivityTypes = () => {
  return useQuery({
    queryKey: ["volunteer-activity-types"],
    queryFn: async (): Promise<VolunteerActivityType[]> => {
      const response = await fetch("/api/volunteer-activities/types")
      if (!response.ok) {
        throw new Error("Erro ao buscar tipos de atividades")
      }
      return response.json()
    },
  })
}

// Get volunteer activities
export const useVolunteerActivities = (filters: VolunteerActivitiesFilters = {}) => {
  return useQuery({
    queryKey: ["volunteer-activities", filters],
    queryFn: async (): Promise<VolunteerActivity[]> => {
      const params = new URLSearchParams()

      if (filters.search) params.append("search", filters.search)
      if (filters.status) params.append("status", filters.status)
      if (filters.sortBy) params.append("sortBy", filters.sortBy)
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder)
      if (filters.userOnly) params.append("userOnly", "true")

      const response = await fetch(`/api/volunteer-activities?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Erro ao buscar atividades de voluntariado")
      }
      return response.json()
    },
  })
}

// Get volunteer statistics
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
      date: string
      hours: number
      activity_type: string
      description?: string
      location?: string
    }) => {
      // First, get the activity type ID
      const typeResponse = await fetch("/api/volunteer-activities/types")
      if (!typeResponse.ok) {
        throw new Error("Erro ao buscar tipos de atividades")
      }
      const types = await typeResponse.json()
      const activityType = types.find((type: any) => type.name === data.activity_type)
      
      if (!activityType) {
        throw new Error("Tipo de atividade não encontrado")
      }

      const response = await fetch("/api/volunteer-activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activity_type_id: activityType.id,
          title: data.activity_type,
          description: data.description,
          hours: data.hours,
          date: data.date,
          location: data.location,
        }),
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
