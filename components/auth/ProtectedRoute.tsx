import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { UserRoleType } from '@/hooks/usePermissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRoleType[]
  requireEmailConfirmation?: boolean
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  requireEmailConfirmation = true 
}: ProtectedRouteProps) {
  const { user, loading: isLoading} = useAuth()
  const { data: userProfile } = useUserProfile()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // Se não estiver autenticado, redireciona para login
      if (!user) {
        router.push('/login')
        return
      }

      // Se precisar confirmar email e não estiver confirmado
      if (requireEmailConfirmation && !userProfile?.email_confirmed_at) {
        router.push('/confirmation')
        return
      }

      // Se tiver roles específicas requeridas
      if (requiredRoles.length > 0) {
        const hasRequiredRole = userProfile?.roles.some(role => 
          requiredRoles.includes(role)
        )

        if (!hasRequiredRole) {
          router.push('/unauthorized')
          return
        }
      }
    }
  }, [user, isLoading, userProfile, requiredRoles, requireEmailConfirmation, router])

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Se não estiver autenticado, não renderiza nada
  if (!user) {
    return null
  }

  // Se precisar confirmar email e não estiver confirmado, não renderiza nada
  if (requireEmailConfirmation && !userProfile?.email_confirmed_at) {
    return null
  }

  // Se tiver roles específicas requeridas e não tiver nenhuma delas, não renderiza nada
  if (requiredRoles.length > 0) {
    const hasRequiredRole = userProfile?.roles.some(role => 
      requiredRoles.includes(role)
    )

    if (!hasRequiredRole) {
      return null
    }
  }

  return <>{children}</>
}
