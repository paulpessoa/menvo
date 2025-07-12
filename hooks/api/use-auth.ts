"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// Tipos
interface SignupData {
  email: string
  password: string
  firstName: string
  lastName: string
  userType: "mentee" | "mentor"
}

interface LoginData {
  email: string
  password: string
}

interface OAuthData {
  provider: "google" | "linkedin_oidc"
  userType: "mentee" | "mentor"
  redirectTo?: string
}

interface UpdateRoleData {
  userId: string
  role: "mentee" | "mentor" | "volunteer"
}

// Hook para obter usuário atual
export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me")
      if (!response.ok) {
        throw new Error("Erro ao buscar usuário")
      }
      return response.json()
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para signup
export function useSignup() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: SignupData) => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro no registro")
      }

      return result
    },
    onSuccess: (data) => {
      toast.success(data.message || "Registro realizado com sucesso!")
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      router.push("/confirmation")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro no registro")
    },
  })
}

// Hook para login
export function useLogin() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro no login")
      }

      return result
    },
    onSuccess: (data) => {
      toast.success("Login realizado com sucesso!")
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })

      // Redirecionar baseado no perfil
      if (data.profile?.role === "pending" || !data.profile?.role) {
        router.push("/auth/select-role")
      } else {
        router.push("/dashboard")
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro no login")
    },
  })
}

// Hook para logout
export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Erro no logout")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Logout realizado com sucesso!")
      queryClient.clear()
      router.push("/")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro no logout")
    },
  })
}

// Hook para forgot password
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao enviar email")
      }

      return result
    },
    onSuccess: (data) => {
      toast.success(data.message || "Email enviado com sucesso!")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao enviar email")
    },
  })
}

// Hook para reset password
export function useResetPassword() {
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: { password: string; access_token: string; refresh_token: string }) => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao redefinir senha")
      }

      return result
    },
    onSuccess: (data) => {
      toast.success(data.message || "Senha redefinida com sucesso!")
      router.push("/login")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao redefinir senha")
    },
  })
}

// Hook para OAuth
export function useOAuth() {
  return useMutation({
    mutationFn: async (data: OAuthData) => {
      const response = await fetch("/api/auth/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro na autenticação OAuth")
      }

      return result
    },
    onSuccess: (data) => {
      // Redirecionar para URL do OAuth
      window.location.href = data.url
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro na autenticação OAuth")
    },
  })
}

// Hook para atualizar role
export function useUpdateRole() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: UpdateRoleData) => {
      const response = await fetch("/api/auth/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao atualizar role")
      }

      return result
    },
    onSuccess: (data) => {
      toast.success(data.message || "Role atualizada com sucesso!")
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      router.push("/dashboard")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar role")
    },
  })
}
