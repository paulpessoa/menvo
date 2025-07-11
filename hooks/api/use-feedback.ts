import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export interface Feedback {
  id: string
  user_id?: string
  email?: string
  rating: number
  comment?: string
  page_url?: string
  user_agent?: string
  created_at: string
  profiles?: {
    first_name: string
    last_name: string
    email: string
    avatar_url?: string
  }
}

export interface FeedbackStats {
  total_feedback: number
  avg_rating: number
  promoters: number
  passives: number
  detractors: number
  nps_score: number
  feedback_last_30_days: number
}

interface FeedbackFilters {
  search?: string
  rating?: number
  sortBy?: "date" | "rating"
  sortOrder?: "asc" | "desc"
}

// Get feedback
export const useFeedback = (filters: FeedbackFilters = {}) => {
  return useQuery({
    queryKey: ["feedback", filters],
    queryFn: async (): Promise<Feedback[]> => {
      const params = new URLSearchParams()

      if (filters.search) params.append("search", filters.search)
      if (filters.rating) params.append("rating", filters.rating.toString())
      if (filters.sortBy) params.append("sortBy", filters.sortBy)
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder)

      const response = await fetch(`/api/feedback?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Erro ao buscar feedback")
      }
      return response.json()
    },
  })
}

// Get feedback statistics
export const useFeedbackStats = () => {
  return useQuery({
    queryKey: ["feedback-stats"],
    queryFn: async (): Promise<FeedbackStats> => {
      const response = await fetch("/api/feedback/stats")
      if (!response.ok) {
        throw new Error("Erro ao buscar estatísticas de feedback")
      }
      return response.json()
    },
  })
}

// Create feedback
export const useCreateFeedback = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      rating: number
      comment?: string
      email?: string
      page_url?: string
    }) => {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao enviar feedback")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] })
      queryClient.invalidateQueries({ queryKey: ["feedback-stats"] })
      toast.success("Feedback enviado com sucesso!")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao enviar feedback")
    },
  })
}
