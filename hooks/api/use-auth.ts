"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/app/context/auth-context"

interface LoginData {
  email: string
  password: string
}

interface SignupData {
  email: string
  password: string
  firstName: string
  lastName: string
}

interface CompleteProfileData {
  role: "mentor" | "mentee" | "volunteer"
  bio?: string
  location?: string
  linkedin_url?: string
  presentation_video_url?: string
  expertise_areas?: string
}

export function useLogin() {
  const { signIn } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: LoginData) => {
      const result = await signIn(data.email, data.password)
      if (result.error) {
        throw new Error(result.error)
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] })
    },
  })
}

export function useSignup() {
  const { signUp } = useAuth()

  return useMutation({
    mutationFn: async (data: SignupData) => {
      const result = await signUp(data.email, data.password, {
        first_name: data.firstName,
        last_name: data.lastName,
        full_name: `${data.firstName} ${data.lastName}`,
      })
      if (result.error) {
        throw new Error(result.error)
      }
      return result
    },
  })
}

export function useCompleteProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CompleteProfileData) => {
      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao completar perfil")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] })
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao enviar email de recuperação")
      }

      return response.json()
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (password: string) => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao resetar senha")
      }

      return response.json()
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
