"use client"

import type React from "react"
import { useAuth } from "@/app/context/auth-context"
import { hasPermission, type Permission, type UserRole } from "@/lib/auth/rbac"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: Permission
  requiredRole?: UserRole
  fallbackPath?: string
}

export function ProtectedRoute({
  children,
  requiredPermission,
  requiredRole,
  fallbackPath = "/login",
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push(fallbackPath)
      return
    }

    if (!profile || profile.role === "pending") {
      router.push("/welcome")
      return
    }

    if (requiredRole && profile.role !== requiredRole) {
      router.push("/unauthorized")
      return
    }

    if (requiredPermission && !hasPermission(profile.role, requiredPermission)) {
      router.push("/unauthorized")
      return
    }
  }, [user, profile, loading, requiredPermission, requiredRole, router, fallbackPath])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || !profile || profile.role === "pending") {
    return null
  }

  if (requiredRole && profile.role !== requiredRole) {
    return null
  }

  if (requiredPermission && !hasPermission(profile.role, requiredPermission)) {
    return null
  }

  return <>{children}</>
}
