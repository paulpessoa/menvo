"use client"

import { useCallback } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function useLogout() {
  const { signOut } = useAuth()

  const logout = useCallback(async (redirectTo: string = "/") => {
    try {
      // signOut em auth-context.tsx já faz window.location.replace('/')
      // Aqui apenas chamamos e deixamos o contexto redirecionar.
      await signOut()
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      // Fallback: força redirect mesmo se signOut lançar
      window.location.replace(redirectTo)
    }
  }, [signOut])

  const logoutAndRedirect = useCallback((redirectTo: string = "/") => {
    logout(redirectTo)
  }, [logout])

  return {
    logout,
    logoutAndRedirect
  }
}