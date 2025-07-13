"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/app/context/auth-context"
import { useAuthOperations } from "@/hooks/useAuth"

export function useCurrentUser() {
  const { user, profile, loading, authenticated } = useAuth()

  return useQuery({
    queryKey: ["current-user"],
    queryFn: () => ({ user, profile }),
    enabled: !loading,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useSignup() {
  const queryClient = useQueryClient()
  const { signUp } = useAuthOperations()

  return useMutation({
    mutationFn: signUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] })
    },
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  const { signIn } = useAuthOperations()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => signIn(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const { signOut } = useAuth()

  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export function useOAuthLogin() {
  const queryClient = useQueryClient()
  const { signInWithGoogle, signInWithLinkedIn, signInWithGitHub } = useAuthOperations()

  return {
    google: useMutation({
      mutationFn: signInWithGoogle,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["current-user"] })
      },
    }),
    linkedin: useMutation({
      mutationFn: signInWithLinkedIn,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["current-user"] })
      },
    }),
    github: useMutation({
      mutationFn: signInWithGitHub,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["current-user"] })
      },
    }),
  }
}
