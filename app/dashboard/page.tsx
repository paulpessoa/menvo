"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, CheckCircle, AlertTriangle, User, Briefcase, MapPin, Calendar, MessageSquare, Settings } from 'lucide-react'
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

export default function DashboardPage() {
  const { user, profile, loading, needsOnboarding, needsValidation } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Verificar se há erro de validação na URL
    const error = searchParams.get("error")
    if (error === "profile_not_validated") {
      toast.error("Seu perfil ainda não foi validado. Aguarde a aprovação.")
    }
  }, [searchParams])

  useEffect(() => {
    if (!loading && needsOnboarding) {
      router.push("/onboarding")
    }
  }, [loading, needsOnboarding, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const getValidationStatus = () => {
    if (profile.is_validated) {
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        badge: <Badge className="bg-green-100 text-green-800">Validado</Badge>,
        message: "Seu perfil foi aprovado! Você tem acesso completo à plataforma."
      }
    } else {
      return {
        icon: <Clock className="h-5 w-5 text-yellow-600" />,
        badge: <Badge variant="outline" className="text-yellow-600">Pendente</Badge>,
        message: "Seu perfil está em análise. Nossa equipe fará a validação em breve."
      }
    }
  }

  const validationStatus = getValidationStatus()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {profile.name}!
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/settings")}>
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>
      </div>

      {/* Status de Validação */}
      {needsValidation && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Perfil em Análise:</strong> Seu perfil está sendo revisado por nossa equipe. 
            Você receberá uma notificação quando for aprovado.
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="text-lg">
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <CardTitle className="text-xl">{profile.name}</CardTitle>
                {validationStatus.badge}
              </div>
              <CardDescription className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  {profile.role === "mentor" ? (
                    <Briefcase className="h-4 w-4 text-green-600" />
                  ) : (
                    <User className="h-4 w-4 text-blue-600" />
                  )}
                  <span className="capitalize">{profile.role}</span>
                </div>
                {profile.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {validationStatus.icon}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {validationStatus.message}
          </p>
          {profile.bio && (
            <div>
              <h4 className="font-medium mb-2">Sobre:</h4>
              <p className="text-sm">{profile.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Sessões
            </CardTitle>
            <CardDescription>
              {profile.role === "mentor" ? "Gerencie suas mentorias" : "Agende sessões com mentores"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => router.push("/sessions")}
              disabled={needsValidation}
            >
              {profile.role === "mentor" ? "Ver Agenda" : "Buscar Mentores"}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
              Mensagens
            </CardTitle>
            <CardDescription>
              Converse com mentores e mentees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push("/messages")}
              disabled={needsValidation}
            >
              Ver Mensagens
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <User className="h-5 w-5 mr-2 text-purple-600" />
              Perfil
            </CardTitle>
            <CardDescription>
              Edite suas informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push("/profile")}
            >
              Editar Perfil
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Mentor-specific content */}
      {profile.role === "mentor" && profile.is_validated && (
        <Card>
          <CardHeader>
            <CardTitle>Painel do Mentor</CardTitle>
            <CardDescription>
              Ferramentas exclusivas para mentores validados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Button 
                onClick={() => router.push("/mentor/availability")}
                className="justify-start"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Configurar Disponibilidade
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push("/mentor/sessions")}
                className="justify-start"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Minhas Mentorias
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>
            Suas últimas interações na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma atividade recente</p>
            <p className="text-sm">
              {needsValidation 
                ? "Aguarde a validação do seu perfil para começar"
                : "Comece agendando uma sessão ou enviando uma mensagem"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
