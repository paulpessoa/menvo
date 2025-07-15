"use client"

import type React from "react"

import { useAuth } from "@/app/context/auth-context"
import { hasPermission, type Permission, type UserRole } from "@/lib/auth/rbac"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

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
  fallbackPath = "/auth",
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // Not authenticated
    if (!user) {
      router.push(fallbackPath)
      return
    }

    // No profile or pending role
    if (!profile || profile.role === "pending") {
      router.push("/welcome")
      return
    }

    // Check required role
    if (requiredRole && profile.role !== requiredRole) {
      router.push("/unauthorized")
      return
    }

    // Check required permission
    if (requiredPermission && !hasPermission(profile.role, requiredPermission)) {
      router.push("/unauthorized")
      return
    }
  }, [user, profile, loading, requiredPermission, requiredRole, router, fallbackPath])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  if (profile.role === "pending") {
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
