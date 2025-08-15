"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { usePermissions } from "@/hooks/usePermissions"
import { Loader2 } from "lucide-react"

interface RouteGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireRole?: "mentor" | "mentee" | "admin" | "volunteer"
  requiredPermissions?: string[]
  redirectTo?: string
}

export function RouteGuard({
  children,
  requireAuth = false,
  requireRole,
  requiredPermissions = [],
  redirectTo = "/login",
}: RouteGuardProps) {
  const { isAuthenticated, user, profile, loading: authLoading } = useAuth()
  const { permissions, loading: permissionsLoading } = usePermissions()
  const router = useRouter()
  const pathname = usePathname()

  const loading = authLoading || permissionsLoading

  useEffect(() => {
    if (loading) return

    if (requireAuth && !isAuthenticated) {
      const loginUrl = redirectTo === "/login" ? `/login?redirect=${encodeURIComponent(pathname)}` : redirectTo
      router.push(loginUrl)
      return
    }

    if (requireRole && profile?.role !== requireRole) {
      router.push("/unauthorized")
      return
    }

    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((permission) => permissions.includes(permission))

      if (!hasAllPermissions) {
        router.push("/unauthorized")
        return
      }
    }
  }, [
    loading,
    isAuthenticated,
    profile?.role,
    permissions,
    requireAuth,
    requireRole,
    requiredPermissions,
    router,
    pathname,
    redirectTo,
  ])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Verificando permissões...</span>
        </div>
      </div>
    )
  }

  const canAccess =
    (!requireAuth || isAuthenticated) &&
    (!requireRole || profile?.role === requireRole) &&
    (requiredPermissions.length === 0 || requiredPermissions.every((p) => permissions.includes(p)))

  if (!canAccess) {
    return null // Will be redirected by useEffect
  }

  return <>{children}</>
}
