"use client"

import { useAuth } from "@/hooks/useAuth"
import { useUserRoles } from "@/app/context/user-roles-context"
import { ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: ('mentee' | 'mentor' | 'admin')[]
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const { userRole, isLoadingRoles } = useUserRoles()
  const router = useRouter()

  const isLoading = authLoading || isLoadingRoles

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login")
      } else if (requiredRoles && requiredRoles.length > 0) {
        if (!userRole || !requiredRoles.includes(userRole)) {
          router.push("/unauthorized")
        }
      }
    }
  }, [user, userRole, isLoading, requiredRoles, router])

  if (isLoading || !user || (requiredRoles && requiredRoles.length > 0 && (!userRole || !requiredRoles.includes(userRole)))) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando...</span>
      </div>
    )
  }

  return <>{children}</>
}
