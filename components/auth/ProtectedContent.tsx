'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUserRoles } from '@/app/context/user-roles-context'
import { Loader2Icon } from 'lucide-react'
import { LoginRequiredModal } from './LoginRequiredModal'
import { useState } from 'react'
import { Database } from '@/types/database'

interface ProtectedContentProps {
  children: ReactNode;
  requiredRoles?: Database['public']['Enums']['user_role'][];
  fallback?: ReactNode; // Optional fallback content if not authorized
}

export default function ProtectedContent({ children, requiredRoles, fallback }: ProtectedContentProps) {
  const { user, loading: authLoading } = useAuth()
  const { userRole, isLoadingRoles } = useUserRoles()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  if (authLoading || isLoadingRoles) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2Icon className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando conteúdo...</span>
      </div>
    )
  }

  if (!user) {
    // User is not logged in
    return (
      <>
        {fallback || (
          <div className="text-center p-8">
            <p className="text-lg text-muted-foreground">Você precisa estar logado para ver este conteúdo.</p>
            <Button onClick={() => setIsLoginModalOpen(true)} className="mt-4">Fazer Login</Button>
          </div>
        )}
        <LoginRequiredModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </>
    )
  }

  if (requiredRoles && !requiredRoles.includes(userRole!)) {
    // User is logged in but does not have the required role
    return (
      fallback || (
        <div className="text-center p-8 text-red-500">
          <p className="text-lg">Acesso Negado.</p>
          <p className="text-muted-foreground">Você não tem permissão para visualizar este conteúdo.</p>
        </div>
      )
    )
  }

  // User is logged in and has the required role (or no role is required)
  return <>{children}</>
}
