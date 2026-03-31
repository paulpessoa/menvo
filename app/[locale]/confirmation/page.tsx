"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, CheckCircle, ArrowRight, AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/auth"
import { UserTypeSelector } from "@/components/auth/UserTypeSelector"
import { UserType } from "@/hooks/useSignupForm"
import { useToast } from "@/hooks/useToast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function ConfirmationPage() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [isEmailExpired, setIsEmailExpired] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserType>("mentee")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Detectar se o email expirou baseado nos parâmetros da URL
  useEffect(() => {
    const error = searchParams.get('error')
    const errorCode = searchParams.get('error_code')
    const errorDescription = searchParams.get('error_description')

    // Verificar se é um erro de OTP expirado
    if (error === 'access_denied' && errorCode === 'otp_expired') {
      setIsEmailExpired(true)
    }
  }, [searchParams])

  const handleRoleSelection = async () => {
    if (!selectedRole || !user) return

    setIsSubmitting(true)
    try {
      console.log("🎯 ConfirmationPage: Selecionando role:", selectedRole)

      // Atualizar role no JWT
      const { error: jwtError } = await supabase.auth.updateUser({
        data: { role: selectedRole }
      })

      if (jwtError) {
        console.error("❌ ConfirmationPage: Erro ao atualizar JWT:", jwtError)
        toast({
          title: "Erro",
          description: "Não foi possível atualizar as permissões. Tente novamente.",
          variant: "destructive",
        })
        return
      }

      // Refresh da sessão para aplicar mudanças
      await supabase.auth.refreshSession()

      console.log("✅ ConfirmationPage: Role definida no JWT com sucesso")
      toast({
        title: "Sucesso",
        description: "Tipo de usuário definido com sucesso!",
      })

      // Redirecionar baseado na role
      if (selectedRole === 'mentor') {
        router.push('/profile?role=mentor')
      } else if (selectedRole === 'mentee') {
        router.push('/profile?role=mentee')
      } else {
        router.push('/dashboard')
      }

    } catch (error) {
      console.error("❌ ConfirmationPage: Erro geral:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // // Redirecionar usuários já logados
  // useEffect(() => {
  //   if (!loading && user) {
  //     router.push('/')
  //   }
  // }, [user, loading, router])

  // // Mostrar loading enquanto verifica autenticação
  // if (loading) {
  //   return (
  //     <div className="container max-w-lg py-16 flex flex-col items-center text-center">
  //       <div className="animate-pulse text-muted-foreground">
  //         {t("common.loading")}
  //       </div>
  //     </div>
  //   )
  // }

  // // Não renderizar se o usuário está logado
  // if (user) {
  //   return null
  // }

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

          {/* Conteúdo para email confirmado com sucesso - Seleção de Role */}
          {!isEmailExpired && (
            <>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t("register.selectRoleDescription")}
                </p>

                {/* Seleção de Role */}
                <UserTypeSelector
                  userType={selectedRole}
                  setUserType={setSelectedRole}
                />
              </div>
            </>
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
                onClick={handleRoleSelection}
                disabled={!selectedRole || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? t("common.saving") : t("register.continue")}
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
