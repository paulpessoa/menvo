'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useUserRoles } from '@/app/context/user-roles-context'
import { Loader2Icon } from 'lucide-react'
import { Database } from '@/types/database'

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: Database['public']['Enums']['user_role'][];
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const { userRole, isLoadingRoles } = useUserRoles()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !isLoadingRoles) {
      if (!user) {
        // Not logged in, redirect to login
        router.push('/login')
      } else if (requiredRoles && !requiredRoles.includes(userRole!)) {
        // Logged in but unauthorized role, redirect to unauthorized page
        router.push('/unauthorized')
      }
    }
  }, [user, userRole, authLoading, isLoadingRoles, requiredRoles, router])

  if (authLoading || isLoadingRoles || !user || (requiredRoles && !requiredRoles.includes(userRole!))) {
    // Show loading spinner or nothing while redirecting
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2Icon className="h-8 w-8 animate-spin" />
        <span className="ml-2">Verificando acesso...</span>
      </div>
    )
  }

  // If we reach here, the user is authenticated and authorized
  return <>{children}</>
}
