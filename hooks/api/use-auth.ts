"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

// Auth keys
const authKeys = {
  user: ["auth", "user"] as const,
  session: ["auth", "session"] as const,
}

// API functions
const authApi = {
  // Get current user
  getCurrentUser: async () => {
    const res = await fetch("/api/auth/me", {
      credentials: "include",
    })
    if (!res.ok) throw new Error("Failed to fetch user")
    return res.json()
  },

  // Login
  login: async (credentials: { email: string; password: string }) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(credentials),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "Login failed")
    }
    return res.json()
  },

  // Register
  register: async (userData: any) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "Registration failed")
    }
    return res.json()
  },

  // Logout
  logout: async () => {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "Logout failed")
    }
    return res.json()
  },

  // Update profile
  updateProfile: async (updates: any) => {
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updates),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "Failed to update profile")
    }
    return res.json()
  },
}

// Hook for current user
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user,
    queryFn: authApi.getCurrentUser,
    retry: false,
    refetchOnMount: true,
  })
}

// Hook for login
export function useLogin() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { toast } = useToast()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.user, data)
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo de volta, ${data.data.profile.first_name}!`,
      })
      router.push("/dashboard")
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

// Hook for registration
export function useRegister() {
  const router = useRouter()
  const { toast } = useToast()

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar a conta.",
      })
      router.push("/login")
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

// Hook for logout
export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { toast } = useToast()

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.user })
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })
      router.push("/")
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao fazer logout",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

// Hook for profile update
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.user, (old: any) => ({
        ...old,
        profile: {
          ...old.profile,
          ...data.profile,
        },
      }))
      queryClient.invalidateQueries({ queryKey: authKeys.user })
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}
