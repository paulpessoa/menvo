"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

export type UserType = "mentee" | "mentor" | "company" | "recruiter"

interface SignupData {
  email: string
  password: string
  firstName: string
  lastName: string
  userType: UserType
}

interface SignupResponse {
  success: boolean
  message: string
  user: {
    id: string
    email: string
    emailConfirmed: boolean
  }
}

export function useSignupMutation() {
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ email, password, firstName, lastName, userType }: SignupData): Promise<SignupResponse> => {
      console.log("🚀 Iniciando registro:", { email, firstName, lastName, userType })

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          userType,
        }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("❌ Erro na resposta:", data)
        throw new Error(data.error || `Erro ${response.status}: ${response.statusText}`)
      }

      console.log("✅ Registro bem-sucedido:", data)
      return data
    },
    onSuccess: (data) => {
      console.log("🎉 Mutation bem-sucedida:", data)
      // Redirecionar para página de confirmação ou dashboard
      if (!data.user.emailConfirmed) {
        router.push("/confirmation")
      } else {
        router.push("/dashboard")
      }
    },
    onError: (error) => {
      console.error("💥 Erro na mutation:", error)
    },
  })
}
