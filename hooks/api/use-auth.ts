"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/app/context/auth-context"

export function useAuthQuery() {
  const { user, profile, permissions, loading, initialized } = useAuth()

  return {
    data: { user, profile, permissions },
    isLoading: loading,
    isInitialized: initialized,
  }
}

export function useSignUp() {
  const { signUp } = useAuth()

  return useMutation({
    mutationFn: async ({
      email,
      password,
      fullName,
      userType,
    }: {
      email: string
      password: string
      fullName: string
      userType: string
    }) => {
      const result = await signUp(email, password, fullName, userType)
      if (result.error) {
        throw new Error(result.error)
      }
      return result
    },
  })
}

export function useSignIn() {
  const { signIn } = useAuth()

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = await signIn(email, password)
      if (result.error) {
        throw new Error(result.error)
      }
      return result
    },
  })
}

export function useCompleteProfile() {
  const { completeProfile } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await completeProfile(data)
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

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      return data
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (password: string) => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      return data
    },
  })
}
