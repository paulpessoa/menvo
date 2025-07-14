"use client"

import type React from "react"
import { useAuth } from "@/app/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { type Permission, hasPermission, hasAnyPermission } from "@/lib/auth/rbac"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: Permission[]
  requireAnyPermission?: boolean
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requireAnyPermission = false,
  fallback = null,
}: ProtectedRouteProps) {
  const { user, profile, loading, initialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!initialized || loading) return

    // Se não está logado, redireciona para login
    if (!user) {
      router.push("/login")
      return
    }

    // Se não tem perfil, algo está errado
    if (!profile) {
      router.push("/welcome")
      return
    }

    // Se o perfil ainda está pending, vai para welcome
    if (profile.role === "pending") {
      router.push("/welcome")
      return
    }

    // Verificar permissões se foram especificadas
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requireAnyPermission
        ? hasAnyPermission(profile.role, requiredPermissions)
        : requiredPermissions.every((permission) => hasPermission(profile.role, permission))

      if (!hasRequiredPermissions) {
        router.push("/unauthorized")
        return
      }
    }
  }, [user, profile, loading, initialized, requiredPermissions, requireAnyPermission, router])

  // Mostrar loading enquanto inicializa
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Se não está logado, não renderiza nada (vai redirecionar)
  if (!user || !profile) {
    return fallback
  }

  // Se o perfil está pending, não renderiza nada (vai redirecionar)
  if (profile.role === "pending") {
    return fallback
  }

  // Verificar permissões
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAnyPermission
      ? hasAnyPermission(profile.role, requiredPermissions)
      : requiredPermissions.every((permission) => hasPermission(profile.role, permission))

    if (!hasRequiredPermissions) {
      return fallback
    }
  }

  return <>{children}</>
}
