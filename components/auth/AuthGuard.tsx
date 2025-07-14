"use client"

import type React from "react"

import { useAuth } from "@/lib/auth/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requiredRole?: string[]
  fallback?: React.ReactNode
}

export function AuthGuard({ children, requireAuth = true, requiredRole = [], fallback = null }: AuthGuardProps) {
  const { user, profile, loading, initialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!initialized || loading) return

    // Se requer autenticação mas não está logado
    if (requireAuth && !user) {
      router.push("/login")
      return
    }

    // Se está logado mas não requer autenticação (páginas de auth)
    if (!requireAuth && user) {
      // Se o perfil ainda está pending, vai para welcome
      if (profile?.role === "pending") {
        router.push("/welcome")
        return
      }
      // Senão vai para dashboard
      router.push("/dashboard")
      return
    }

    // Se requer role específica
    if (requireAuth && user && profile && requiredRole.length > 0) {
      if (!requiredRole.includes(profile.role)) {
        router.push("/unauthorized")
        return
      }
    }

    // Se usuário logado tem role pending, redireciona para welcome
    if (requireAuth && user && profile?.role === "pending") {
      router.push("/welcome")
      return
    }
  }, [user, profile, loading, initialized, requireAuth, requiredRole, router])

  // Mostrar loading enquanto inicializa
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Se requer auth mas não está logado, não renderiza nada (vai redirecionar)
  if (requireAuth && !user) {
    return fallback
  }

  // Se não requer auth mas está logado, não renderiza nada (vai redirecionar)
  if (!requireAuth && user) {
    return fallback
  }

  // Se requer role específica mas não tem
  if (requireAuth && user && profile && requiredRole.length > 0) {
    if (!requiredRole.includes(profile.role)) {
      return fallback
    }
  }

  // Se usuário tem role pending em página protegida, não renderiza
  if (requireAuth && user && profile?.role === "pending") {
    return fallback
  }

  return <>{children}</>
}
