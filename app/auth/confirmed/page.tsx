"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Loader2 } from "lucide-react"

export default function EmailConfirmedPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (!loading && !user) {
      // Se não está logado, redireciona para login
      router.push("/login")
      return
    }

    if (!loading && user && profile) {
      // Inicia countdown para redirecionamento automático
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            handleRedirect()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [loading, user, profile, router])

  const handleRedirect = () => {
    if (!profile) return

    // Lógica de redirecionamento baseada no perfil
    if (!profile.role || profile.role === "pending") {
      router.push("/onboarding/role-selection")
    } else if (profile.status === "pending") {
      router.push("/profile?complete=true")
    } else {
      router.push("/dashboard")
    }
  }

  const getRedirectMessage = () => {
    if (!profile) return "Carregando..."

    if (!profile.role || profile.role === "pending") {
      return "Você será redirecionado para selecionar seu tipo de conta"
    } else if (profile.status === "pending") {
      return "Você será redirecionado para completar seu perfil"
    } else {
      return "Você será redirecionado para o dashboard"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return null // Será redirecionado para login
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            Email Confirmado!
          </CardTitle>
          <CardDescription className="text-gray-600">
            Sua conta foi ativada com sucesso. Bem-vindo ao Menvo!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Olá, <strong>{profile?.first_name || user.email}</strong>!
            </p>
            <p className="text-sm text-gray-500">
              {getRedirectMessage()}
            </p>
          </div>

          {countdown > 0 && (
            <div className="text-center">
              <p className="text-sm text-gray-400">
                Redirecionando automaticamente em {countdown} segundos...
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleRedirect}
              className="w-full"
            >
              Continuar Agora
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400">
              Precisa de ajuda? Entre em contato conosco.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
