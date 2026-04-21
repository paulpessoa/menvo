"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, ArrowLeft, CheckCircle, Loader2, PartyPopper } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useTranslations } from "next-intl"
import { useAuth } from "@/lib/auth"

export default function ResendConfirmationPage() {
  const t = useTranslations("auth.resend")
  const tCommon = useTranslations("common")
  const tLogin = useTranslations("login")
  const { profile, isAuthenticated, loading: authLoading, handleAuthError } = useAuth()
  const router = useRouter()
  
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) return

    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`
        }
      })

      if (resendError) {
        console.error("Error resending confirmation:", resendError)
        setError(handleAuthError(resendError))
      } else {
        setSent(true)
      }
    } catch (error: any) {
      console.error("Unexpected error:", error)
      setError(handleAuthError(error))
    } finally {
      setLoading(false)
    }
  }

  // ESTADO 1: Carregando Auth
  if (authLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  // ESTADO 2: Usuário já está confirmado (UX Proativa)
  if (isAuthenticated && profile?.verified) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
          <Card className="w-full max-w-md border-2 shadow-2xl overflow-hidden">
            <div className="h-2 bg-primary" />
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PartyPopper className="h-10 w-10" />
              </div>
              <CardTitle className="text-3xl font-bold">Você já está confirmado!</CardTitle>
              <CardDescription className="text-base pt-2">
                Sua conta já foi verificada com sucesso. Você não precisa reenviar o e-mail de confirmação.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Button 
                onClick={() => router.push("/dashboard")}
                className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20"
              >
                Ir para o meu Dashboard
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => router.push("/")}
                className="w-full mt-4"
              >
                Voltar ao Início
              </Button>
            </CardContent>
          </Card>
        </div>
      )
  }

  // ESTADO 3: E-mail Enviado com Sucesso
  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="w-full max-w-md shadow-xl border-2 border-green-100">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">
              {t("successTitle")}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {t("successDescription")}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-white/50 rounded-xl border border-green-200">
              <p className="text-sm text-gray-600">
                {t("sentTo")} <br/>
                <strong className="text-base text-gray-900">{email}</strong>
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button 
                onClick={() => router.push("/login")}
                className="w-full h-12 font-bold"
              >
                {tLogin("loginButton")}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setSent(false)}
                className="w-full h-12 bg-transparent"
              >
                {t("otherEmail")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ESTADO 4: Formulário de Reenvio (Padrão)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md text-foreground border-2 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {t("description")}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleResend} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{tCommon("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={tLogin("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-200 animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 font-bold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tLogin("loggingIn")}
                </>
              ) : (
                t("button")
              )}
            </Button>

            <Button 
              type="button"
              variant="ghost" 
              onClick={() => router.back()}
              className="w-full h-12"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {tCommon("back")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
