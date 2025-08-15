"use client"

import type React from "react"

import { useAuth } from "@/hooks/useAuth"
import { usePermissions } from "@/hooks/usePermissions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock, UserCheck, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ProtectedContentProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireMentor?: boolean
  requireVerified?: boolean
  requiredPermissions?: string[]
  fallbackType?: "blur" | "card" | "minimal"
  className?: string
}

export function ProtectedContent({
  children,
  requireAuth = true,
  requireMentor = false,
  requireVerified = false,
  requiredPermissions = [],
  fallbackType = "blur",
  className = "",
}: ProtectedContentProps) {
  const { isAuthenticated, user, profile, loading } = useAuth()
  const { permissions, loading: permissionsLoading } = usePermissions()
  const router = useRouter()

  if (loading || permissionsLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  const hasAuth = !requireAuth || isAuthenticated
  const isMentor = !requireMentor || profile?.role === "mentor"
  const isVerified = !requireVerified || profile?.verified_at !== null
  const hasPermissions =
    requiredPermissions.length === 0 || requiredPermissions.every((permission) => permissions.includes(permission))

  const canAccess = hasAuth && isMentor && isVerified && hasPermissions

  if (canAccess) {
    return <>{children}</>
  }

  let title = "Acesso Restrito"
  let description = "Você não tem permissão para acessar este conteúdo."
  let actionText = "Fazer Login"
  let actionHref = "/login"
  let icon = Shield

  if (!hasAuth) {
    title = "Login Necessário"
    description = "Você precisa estar logado para acessar este conteúdo."
    actionText = "Fazer Login"
    actionHref = "/login"
    icon = Lock
  } else if (!isMentor) {
    title = "Apenas para Mentores"
    description = "Este conteúdo está disponível apenas para mentores verificados."
    actionText = "Tornar-se Mentor"
    actionHref = "/signup?type=mentor"
    icon = UserCheck
  } else if (!isVerified) {
    title = "Verificação Pendente"
    description = "Seu perfil de mentor ainda está em processo de verificação."
    actionText = "Ver Status"
    actionHref = "/dashboard"
    icon = UserCheck
  } else if (!hasPermissions) {
    title = "Permissão Insuficiente"
    description = "Você não tem as permissões necessárias para acessar este conteúdo."
    actionText = "Voltar"
    actionHref = "/dashboard"
    icon = Shield
  }

  if (fallbackType === "minimal") {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-sm text-muted-foreground mb-2">{description}</p>
        <Button size="sm" asChild>
          <Link href={actionHref}>{actionText}</Link>
        </Button>
      </div>
    )
  }

  if (fallbackType === "card") {
    return (
      <Card className={className}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link href={actionHref}>{actionText}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Default blur fallback
  return (
    <div className={`relative ${className}`}>
      <div className="blur-sm pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <icon className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <Button asChild className="w-full">
              <Link href={actionHref}>{actionText}</Link>
            </Button>
            {hasAuth && (
              <Button variant="outline" onClick={() => router.back()} className="w-full">
                Voltar
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
