"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowRight, Users, Calendar, MessageSquare } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export default function WelcomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [userName, setUserName] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    
    if (user) {
      // Extrair nome do email ou usar dados do perfil
      const name = user.user_metadata?.first_name || 
                   user.email?.split('@')[0] || 
                   'Usuário'
      setUserName(name)
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="container flex h-screen max-w-screen-xl flex-col items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container max-w-4xl py-16">
      <div className="text-center space-y-6">
        {/* Header de Boas-vindas */}
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Bem-vindo ao Menvo, {userName}! 🎉
            </h1>
            <p className="text-xl text-muted-foreground mt-2">
              Sua conta foi confirmada com sucesso. Agora você faz parte da nossa comunidade!
            </p>
          </div>
        </div>

        {/* Cards de Próximos Passos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Explore Mentores</CardTitle>
              <CardDescription>
                Descubra mentores incríveis em diversas áreas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/mentors">
                  Encontrar Mentores
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 mb-4">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Complete seu Perfil</CardTitle>
              <CardDescription>
                Adicione mais informações para melhorar sua experiência
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/settings">
                  Editar Perfil
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Agende uma Mentoria</CardTitle>
              <CardDescription>
                Comece sua jornada de aprendizado hoje mesmo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/mentorship">
                  Ver Mentorias
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🚀 Próximos Passos Recomendados
          </h3>
          <ul className="text-left text-blue-800 space-y-2 max-w-2xl mx-auto">
            <li className="flex items-start">
              <span className="font-semibold mr-2">1.</span>
              Complete seu perfil com suas habilidades e interesses
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">2.</span>
              Explore nossa comunidade de mentores e encontre o match perfeito
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">3.</span>
              Agende sua primeira sessão de mentoria gratuita
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">4.</span>
              Conecte-se com outros membros da comunidade
            </li>
          </ul>
        </div>

        {/* CTA Principal */}
        <div className="mt-8">
          <Button asChild size="lg" className="text-lg px-8 py-3">
            <Link href="/">
              Começar a Explorar
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
