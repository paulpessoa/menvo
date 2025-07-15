"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

interface DashboardStats {
  totalUsers: number
  totalMentors: number
  totalMentees: number
  totalVolunteers: number
  pendingVerifications: number
  totalVolunteerHours: number
  recentActivities: Array<{
    id: string
    type: string
    description: string
    created_at: string
  }>
}

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  full_name?: string
  role: string
  status: string
  verification_status: string
  created_at: string
  updated_at: string
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/admin/dashboard")
      if (!response.ok) {
        throw new Error("Erro ao buscar dados do dashboard")
      }
      return response.json() as Promise<DashboardStats>
    },
  })
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users")
      if (!response.ok) {
        throw new Error("Erro ao buscar usuários")
      }
      return response.json() as Promise<User[]>
    },
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar status")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] })
    },
  })
}

export function useVerifyMentor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      status,
      feedback,
    }: {
      userId: string
      status: "verified" | "rejected"
      feedback?: string
    }) => {
      const response = await fetch("/api/admin/mentors/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, status, feedback }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao verificar mentor")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] })
    },
  })
}
