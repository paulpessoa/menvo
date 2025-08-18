"use client"

import { useCallback } from "react"
import { useAuth } from "@/app/context/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function useLogout() {
  const { signOut } = useAuth()
  const router = useRouter()

  const logout = useCallback(async (redirectTo: string = "/") => {
    try {
      await signOut()
      
      // Show success message
      toast.success("Logout realizado com sucesso!")
      
      // Redirect after a short delay to allow toast to show
      setTimeout(() => {
        router.push(redirectTo)
        router.refresh()
      }, 1000)
      
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      toast.error("Erro ao fazer logout. Redirecionando...")
      
      // Still redirect even if logout failed
      setTimeout(() => {
        router.push("/login?error=logout-failed")
        router.refresh()
      }, 1500)
    }
  }, [signOut, router])

  const logoutAndRedirect = useCallback((redirectTo: string = "/") => {
    logout(redirectTo)
  }, [logout])

  return {
    logout,
    logoutAndRedirect
  }
}