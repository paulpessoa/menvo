"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { RoleSelectionModal } from "./RoleSelectionModal"
import { ProfileCompletionModal } from "./ProfileCompletionModal"
import { ValidationPendingModal } from "./ValidationPendingModal"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, profile, loading, isAuthenticated, needsRoleSelection, needsVerification } =
    useAuth()

  const router = useRouter()
  const pathname = usePathname()
  const [showRoleSelection, setShowRoleSelection] = useState(false)
  const [showProfileCompletion, setShowProfileCompletion] = useState(false)
  const [showValidationPending, setShowValidationPending] = useState(false)

  // Rotas que não precisam de autenticação
  const publicRoutes = [
    "/",
    "/about",
    "/how-it-works",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/unauthorized",
    "/confirmation",
    "/auth/callback",
  ]

  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))

  useEffect(() => {
    if (loading) return

    // Se não está autenticado e não é rota pública, redirecionar para login
    if (!isAuthenticated && !isPublicRoute) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    // Se está autenticado, verificar fluxos necessários
    if (isAuthenticated && !isPublicRoute) {
      if (needsRoleSelection) {
        setShowRoleSelection(true)
        return
      }

      if (needsVerification) {
        setShowValidationPending(true)
        return
      }
    }

    // Resetar modals se não precisar mais
    setShowRoleSelection(false)
    setShowProfileCompletion(false)
    setShowValidationPending(false)
  }, [
    loading,
    isAuthenticated,
    needsRoleSelection,
    needsVerification,
    isPublicRoute,
    pathname,
    router,
  ])

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
      <RoleSelectionModal open={showRoleSelection} onClose={() => setShowRoleSelection(false)} />

      <ValidationPendingModal open={showValidationPending} onClose={() => setShowValidationPending(false)} />
    </>
  )
}
