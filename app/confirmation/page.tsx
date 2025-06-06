"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, CheckCircle, ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/hooks/useAuth"

export default function ConfirmationPage() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirecionar usuários já logados
  useEffect(() => {
    if (!loading && user) {
      router.push('/')
    }
  }, [user, loading, router])

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="container max-w-lg py-16 flex flex-col items-center text-center">
        <div className="animate-pulse text-muted-foreground">
          {t("common.loading")}
        </div>
      </div>
    )
  }

  // Não renderizar se o usuário está logado
  if (user) {
    return null
  }

  return (
    <div className="container max-w-lg py-16 flex flex-col items-center text-center">
      <Card>
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>{t("register.confirmEmail")}</CardTitle>
          <CardDescription>
            {t("register.confirmEmailDescription", { email: "seu@email.com" })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>{t("register.nextSteps")}</strong>
            </p>
            <ol className="mt-2 list-decimal list-inside text-sm text-blue-700 space-y-1">
              {(t("register.nextStepsList", { returnObjects: true }) as string[]).map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
          <p className="text-muted-foreground text-sm">
            {t("register.afterConfirmation")}
          </p>
          <div className="rounded-lg bg-yellow-50 p-3">
            <p className="text-xs text-yellow-800">
              <strong>{t("register.didntReceiveEmail")}</strong> {t("register.checkSpam")}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/login">
              {t("register.goToLogin")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">
              {t("register.goToHome")}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
