"use client"

import { useAuth } from "@/hooks/useAuth"
import { usePermissions, type Permission } from "@/hooks/usePermissions"
import type { ReactNode } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"
import Link from "next/link"

interface ProtectedRouteProps {
  children: ReactNode
  requireAuth?: boolean
  requiredPermissions?: Permission[]
  fallback?: ReactNode
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requiredPermissions = [],
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth()
  const { hasAllPermissions } = usePermissions()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return (
      fallback || (
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Você precisa estar logado para acessar esta página.</span>
              <Button asChild>
                <Link href="/auth">Fazer login</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )
    )
  }

  if (requiredPermissions.length > 0 && !hasAllPermissions(requiredPermissions)) {
    return (
      fallback || (
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>Você não tem permissão para acessar esta página.</AlertDescription>
          </Alert>
        </div>
      )
    )
  }

  return <>{children}</>
}
