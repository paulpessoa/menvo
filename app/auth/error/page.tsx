"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw } from "lucide-react"

const errorMessages = {
  oauth_error: "Erro na autenticação com provedor externo. Tente novamente.",
  callback_error: "Erro no processo de confirmação. O link pode estar inválido.",
  verification_error: "Erro na verificação. O link pode ter expirado ou ser inválido.",
  token_expired: "O link de verificação expirou. Solicite um novo email.",
  token_invalid: "Link de verificação inválido. Verifique se você clicou no link correto.",
  unknown_callback_type: "Tipo de verificação não reconhecido.",
  profile_creation_failed: "Erro ao criar perfil. Tente fazer login novamente.",
  auth_error: "Erro na autenticação. O link pode ter expirado.",
  expired_link: "Link de confirmação expirado.",
  invalid_link: "Link de confirmação inválido.",
  default: "Ocorreu um erro durante a verificação."
}

export default function AuthErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string>("")
  const [callbackType, setCallbackType] = useState<string>("")

  useEffect(() => {
    const errorType = searchParams.get("error") || "default"
    const type = searchParams.get("type") || ""
    setError(errorMessages[errorType as keyof typeof errorMessages] || errorMessages.default)
    setCallbackType(type)
  }, [searchParams])

  const handleRetry = () => {
    router.push("/auth/login")
  }

  const handleResendEmail = () => {
    // Redirect to appropriate page based on callback type
    switch (callbackType) {
      case 'signup':
        router.push("/auth/confirm-email")
        break
      case 'recovery':
        router.push("/auth/forgot-password")
        break
      case 'invite':
        router.push("/auth/login") // Admin needs to resend invite
        break
      default:
        router.push("/auth/confirm-email")
    }
  }

  const getResendButtonText = () => {
    switch (callbackType) {
      case 'signup':
        return "Reenviar Email de Confirmação"
      case 'recovery':
        return "Solicitar Nova Recuperação"
      case 'invite':
        return "Contatar Administrador"
      default:
        return "Reenviar Email"
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-800">
            Erro na Confirmação
          </CardTitle>
          <CardDescription className="text-gray-600">
            {error}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Não se preocupe, você pode tentar novamente.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleRetry}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Fazer Login
            </Button>

            <Button
              variant="outline"
              onClick={handleResendEmail}
              className="w-full"
            >
              {getResendButtonText()}
            </Button>

            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400">
              Se o problema persistir, entre em contato com o suporte.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
