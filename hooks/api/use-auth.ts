"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/app/context/auth-context"

interface SignupData {
  email: string
  password: string
  fullName: string
  userType: string
}

interface LoginData {
  email: string
  password: string
}

export function useSignup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SignupData) => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao criar conta")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] })
    },
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao fazer login")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] })
    },
  })
}

export function useLogout() {
  const { signOut } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await signOut()
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export function useCurrentUser() {
  const { user, profile, loading } = useAuth()

  return {
    data: user ? { user, profile } : null,
    isLoading: loading,
    isAuthenticated: !!user,
  }
}
