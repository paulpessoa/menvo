'use client'

import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CalendarIcon, UsersIcon, MessageSquareIcon, SettingsIcon, UserIcon } from 'lucide-react'
import { useUserRoles } from '@/app/context/user-roles-context'

export default function DashboardPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const { userProfile, loading: profileLoading } = useUserProfile(user?.id)
  const { isAdmin, isMentor, isMentee, isLoadingRoles } = useUserRoles()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    } else if (!authLoading && isAuthenticated && !profileLoading && userProfile && !userProfile.is_profile_complete) {
      router.push('/profile?message=Por favor, complete seu perfil para continuar.')
    }
  }, [authLoading, isAuthenticated, profileLoading, userProfile, router])

  if (authLoading || profileLoading || isLoadingRoles) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando painel...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Should redirect by useEffect
  }

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">
          Bem-vindo, {userProfile?.full_name || user?.email}!
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isMentee && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Encontrar Mentores</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mb-4">Conecte-se</p>
                <p className="text-muted-foreground mb-4">
                  Explore nossa rede de mentores experientes e encontre a pessoa certa para te guiar.
                </p>
                <Link href="/mentors" passHref>
                  <Button className="w-full">Buscar Mentores</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {isMentor && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gerenciar Mentoria</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mb-4">Suas Sessões</p>
                <p className="text-muted-foreground mb-4">
                  Visualize e gerencie suas sessões de mentoria agendadas.
                </p>
                <Link href="/mentorship" passHref>
                  <Button className="w-full">Ver Minhas Mentorias</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meu Perfil</CardTitle>
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold mb-4">Atualize suas informações</p>
              <p className="text-muted-foreground mb-4">
                Mantenha seu perfil atualizado para melhores conexões.
              </p>
              <Link href="/profile" passHref>
                <Button className="w-full">Editar Perfil</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
              <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold mb-4">Converse</p>
              <p className="text-muted-foreground mb-4">
                Envie e receba mensagens de seus mentores e mentees.
              </p>
              <Link href="/messages" passHref>
                <Button className="w-full">Ver Mensagens</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Configurações</CardTitle>
              <SettingsIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold mb-4">Ajuste suas preferências</p>
              <p className="text-muted-foreground mb-4">
                Gerencie suas configurações de conta e privacidade.
              </p>
              <Link href="/settings" passHref>
                <Button className="w-full">Ir para Configurações</Button>
              </Link>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Painel Admin</CardTitle>
                <SettingsIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mb-4">Gerenciar Plataforma</p>
                <p className="text-muted-foreground mb-4">
                  Acesse ferramentas administrativas para gerenciar usuários e conteúdo.
                </p>
                <Link href="/admin" passHref>
                  <Button className="w-full">Acessar Painel Admin</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
