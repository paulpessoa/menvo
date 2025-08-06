"use client"

import { useAuth } from "@/hooks/useAuth"
import { useUserRoles } from "@/app/context/user-roles-context"
import { ReactNode } from "react"
import { Loader2, ShieldOff } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ProtectedContentProps {
  children: ReactNode
  requiredRoles?: ('mentee' | 'mentor' | 'admin')[]
  fallback?: ReactNode
}

export function ProtectedContent({ children, requiredRoles, fallback }: ProtectedContentProps) {
  const { user, loading: authLoading } = useAuth()
  const { userRole, isLoadingRoles } = useUserRoles()

  const isLoading = authLoading || isLoadingRoles

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando conteúdo...</span>
      </div>
    )
  }

  if (!user) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <ShieldOff className="mb-6 h-20 w-20 text-red-500" />
        <h2 className="mb-3 text-3xl font-bold tracking-tight">Acesso Restrito</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          Você precisa estar logado para visualizar este conteúdo.
        </p>
        <Link href="/login" passHref>
          <Button>Fazer Login</Button>
        </Link>
      </div>
    )
  }

  if (requiredRoles && requiredRoles.length > 0) {
    if (!userRole || !requiredRoles.includes(userRole)) {
      return fallback || (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <ShieldOff className="mb-6 h-20 w-20 text-red-500" />
          <h2 className="mb-3 text-3xl font-bold tracking-tight">Acesso Não Autorizado</h2>
          <p className="mb-8 max-w-md text-muted-foreground">
            Sua conta não possui as permissões necessárias para acessar esta página.
          </p>
          <Link href="/dashboard" passHref>
            <Button>Ir para o Dashboard</Button>
          </Link>
        </div>
      )
    }
  }

  return <>{children}</>
}
