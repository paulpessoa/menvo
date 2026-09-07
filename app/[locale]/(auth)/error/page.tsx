"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter } from "@/i18n/routing"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react"

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
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  )
}

function AuthErrorContent() {
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
    router.push("/login")
  }

  const handleResendEmail = () => {
    switch (callbackType) {
      case 'signup':
        router.push("/resend-confirmation")
        break
      case 'recovery':
        router.push("/forgot-password")
        break
      case 'invite':
        router.push("/login")
        break
      default:
        router.push("/resend-confirmation")
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
    <Card className="w-full max-w-md shadow-lg border-red-100">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 ring-8 ring-red-50">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-red-800">
          Erro na Autenticação
        </CardTitle>
        <CardDescription className="text-gray-600 mt-2">
          {error}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Não se preocupe, você pode tentar novamente ou solicitar um novo link.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <Button
            onClick={handleRetry}
            className="w-full h-11"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Fazer Login
          </Button>

          <Button
            variant="outline"
            onClick={handleResendEmail}
            className="w-full h-11"
          >
            {getResendButtonText()}
          </Button>

          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="w-full h-11"
          >
            Voltar ao Início
          </Button>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Se o problema persistir, entre em contato com o suporte.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}