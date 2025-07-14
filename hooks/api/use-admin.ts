"use client"

import { useQuery } from "@tanstack/react-query"

interface DashboardStats {
  totalUsers: number
  pendingVerifications: number
  totalMentors: number
  activeMentors: number
  totalVolunteers: number
  pendingActivities: number
  totalSessions: number
  completedSessions: number
}

interface DashboardData {
  stats: DashboardStats
  recentActivities: any[]
  pendingMentors: any[]
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async (): Promise<DashboardData> => {
      const response = await fetch("/api/admin/dashboard")

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao buscar dados do dashboard")
      }

      return response.json()
    },
  })
}
