"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowRight, AlertTriangle } from "lucide-react"
import { useTranslations } from "next-intl"
import { useAuth } from "@/lib/auth"

export default function ConfirmationPage() {
  const t = useTranslations()
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isEmailExpired, setIsEmailExpired] = useState(false)

  // Detectar se o email expirou baseado nos parâmetros da URL
  useEffect(() => {
    const error = searchParams.get('error')
    const errorCode = searchParams.get('error_code')

    // Verificar se é um erro de OTP expirado
    if (error === 'access_denied' && errorCode === 'otp_expired') {
      setIsEmailExpired(true)
    }
  }, [searchParams])

  const handleContinue = () => {
    // Redirecionar para o perfil para completar cadastro
    router.push('/profile')
  }

  return (
    <div className="container max-w-lg py-16 flex flex-col items-center text-center">
      <Card>
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            {isEmailExpired ? (
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            ) : (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
          </div>
          <CardTitle>
            {isEmailExpired ? t("register.emailExpired") : t("register.emailConfirmed")}
          </CardTitle>
          <CardDescription>
            {isEmailExpired
              ? t("register.emailExpiredDescription")
              : t("register.emailConfirmedDescription")
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Conteúdo para email confirmado com sucesso */}
          {!isEmailExpired && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("register.emailConfirmedNext")}
              </p>
            </div>
          )}

          {/* Conteúdo para email expirado */}
          {isEmailExpired && (
            <div className="rounded-lg bg-orange-50 p-3 border border-orange-200">
              <p className="text-xs text-orange-800 mb-2">
                <strong>{t("register.emailExpired")}</strong>
              </p>
              <p className="text-xs text-orange-700 mb-3">
                {t("register.emailExpiredDescription")}
              </p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/forgot-password">
                  {t("register.emailExpiredAction")}
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {isEmailExpired ? (
            <>
              <Button asChild className="w-full">
                <Link href="/forgot-password">
                  {t("register.emailExpiredAction")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/signup">
                  {t("register.tryAgain")}
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleContinue}
                className="w-full"
              >
                {t("register.continue")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  {t("register.goToHome")}
                </Link>
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
