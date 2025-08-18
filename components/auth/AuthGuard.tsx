"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/app/context/auth-context"
import { ValidationPendingModal } from "./ValidationPendingModal"
import { Loader2 } from "lucide-react"
import { publicRoutes } from "@/config/routes"

interface AuthGuardProps {
  children: React.ReactNode
  requiredPermissions?: string[]
}

export function AuthGuard({ children, requiredPermissions }: AuthGuardProps) {
  const {
    user,
    profile,
    loading,
    isAuthenticated,
    needsRoleSelection,
    needsVerification,
    hasAnyPermission
  } = useAuth()

  const router = useRouter()
  const pathname = usePathname()
  const [showValidationPending, setShowValidationPending] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )

  useEffect(() => {
    if (loading) return

    // Se não está autenticado e não é rota pública, redirecionar para login
    if (!isAuthenticated && !isPublicRoute) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    // Se está autenticado, verificar fluxos necessários
    if (isAuthenticated && !isPublicRoute) {
      if (needsRoleSelection() && pathname !== "/onboarding/role-selection") {
        router.push("/onboarding/role-selection")
        return
      }

      if (needsVerification()) {
        setShowValidationPending(true)
        return
      }

      if (requiredPermissions && !hasAnyPermission(requiredPermissions)) {
        router.push("/unauthorized")
        return
      }
    }

    // Resetar modals se não precisar mais
    setShowValidationPending(false)
  }, [
    loading,
    isAuthenticated,
    needsRoleSelection,
    needsVerification,
    isPublicRoute,
    pathname,
    router,
    requiredPermissions,
    hasAnyPermission
  ])

  // Evitar hydration mismatch - não renderizar até estar montado no cliente
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    )
  }

  // Mostrar loading enquanto carrega
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      {children}

      {/* Modals de fluxo de autenticação */}
      <ValidationPendingModal
        open={showValidationPending}
        onClose={() => setShowValidationPending(false)}
      />
    </>
  )
}
