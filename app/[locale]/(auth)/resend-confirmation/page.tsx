"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, Link } from "@/i18n/routing"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Mail, ArrowLeft, AlertCircle, CheckCircle2, LayoutDashboard } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { auth as authService } from "@/lib/services/auth/auth.service"
import { useTranslations } from "next-intl"

export default function ResendConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResendConfirmationContent />
    </Suspense>
  )
}

function ResendConfirmationContent() {
  const t = useTranslations("auth.resend")
  const tCommon = useTranslations("common")
  const tLogin = useTranslations("login")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, handleAuthError } = useAuth()

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const emailParam = searchParams.get("email")
    if (emailParam) {
      setEmail(emailParam)
    } else if (user?.email) {
      setEmail(user.email)
    }
  }, [searchParams, user])

  // Se o usuário já estiver logado e com e-mail confirmado
  if (user && user.email_confirmed_at) {
    return (
      <Card className="w-full max-w-md border-primary/20 shadow-xl animate-in zoom-in-95 duration-500">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {t("alreadyVerifiedTitle")}
          </CardTitle>
          <CardDescription className="text-base text-gray-500">
            {t("alreadyVerifiedMessage")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-600 text-center">
            {t("alreadyVerifiedDetail", { email: user.email || "" })}
          </div>
          <Button asChild className="w-full h-12 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-5 w-5" />
              Ir para o Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError("")

    try {
      await authService.resendConfirmationEmail(email)
      setSent(true)
    } catch (err: any) {
      console.error("Error resending confirmation:", err)
      const message = handleAuthError(err) || "Ocorreu um erro ao reenviar o e-mail."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card className="w-full max-w-md shadow-lg border-gray-200 animate-in fade-in duration-500">
        <CardContent className="pt-8 space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">{t("successTitle")}</h3>
            <p className="text-sm text-gray-500">{t("successDescription")}</p>
            <p className="text-xs text-muted-foreground font-mono bg-gray-50 p-2 rounded">
              {email}
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => router.push("/login")}
          >
            {tCommon("login")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-gray-200">
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
          {t("title")}
        </CardTitle>
        <CardDescription className="text-gray-500">
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResend} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
              {tCommon("email")}
            </Label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 border-gray-200 focus:border-primary focus:ring-primary/20"
                required
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 animate-in slide-in-from-top-1">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 font-bold"
            disabled={loading || !email}
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
  )
}
