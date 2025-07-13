"use client"

import { useAuth } from "@/app/context/auth-context"
import { usePermissions, type Permission } from "@/hooks/usePermissions"
import type { ReactNode } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Shield, Loader2 } from "lucide-react"
import Link from "next/link"

interface ProtectedRouteProps {
  children: ReactNode
  requiredPermissions?: Permission[]
  fallback?: ReactNode
}

export function ProtectedRoute({ children, requiredPermissions = [], fallback }: ProtectedRouteProps) {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { permissions, loading: permsLoading } = usePermissions()

  const loading = authLoading || permsLoading

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Você precisa estar logado para acessar esta página.</span>
              <Button asChild>
                <Link href="/login">Fazer login</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )
    )
  }

  const hasAllRequiredPermissions = requiredPermissions.every((p) => permissions.includes(p))

  if (requiredPermissions.length > 0 && !hasAllRequiredPermissions) {
    return (
      fallback || (
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>Você não tem permissão para acessar esta página.</AlertDescription>
          </Alert>
        </div>
      )
    )
  }

  return <>{children}</>
}
