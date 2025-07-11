"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Loader2, Linkedin, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

function LoginForm() {
  const { t } = useTranslation()
  const { isAuthenticated, login, signInWithGoogle, signInWithLinkedIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Redirecionar usuários já logados
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login({ email, password })
      toast.success(t("login.success") || "Login realizado com sucesso!")
      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message)
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError("")
    setIsGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
      setIsGoogleLoading(false)
    }
  }

  const handleLinkedInLogin = async () => {
    setError("")
    setIsLinkedInLoading(true)
    try {
      await signInWithLinkedIn()
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
      setIsLinkedInLoading(false)
    }
  }

  return (
    <div className="container max-w-5xl py-10 md:py-16">
      <Card className="mx-auto max-w-md">
        <CardHeader className="flex flex-col items-center">
          <CardTitle>{t("login.title") || "Entrar"}</CardTitle>
          <CardDescription>{t("login.description") || "Acesse sua conta"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* OAuth Buttons */}
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLinkedInLoading || isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {isGoogleLoading ? t("login.connecting") || "Conectando..." : t("login.continueWith") + " Google"}
            </Button>

            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleLinkedInLogin}
              disabled={isGoogleLoading || isLinkedInLoading || isLoading}
            >
              <Linkedin className="mr-2 h-4 w-4 text-[#0077B5]" />
              {isLinkedInLoading ? t("login.connecting") || "Conectando..." : t("login.continueWith") + " LinkedIn"}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("login.orContinueWith") || "Ou continue com email"}
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.email") || "Email"}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("login.emailPlaceholder") || "seu@email.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("login.password") || "Senha"}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("login.passwordPlaceholder") || "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  {t("login.loggingIn") || "Entrando..."}
                </span>
              ) : (
                <>
                  <span>{t("login.loginButton") || "Entrar"}</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center">
              <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary underline">
                {t("login.forgotPassword") || "Esqueceu sua senha?"}
              </Link>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-center text-sm text-muted-foreground w-full">
            {t("login.noAccount") || "Não tem uma conta?"}{" "}
            <Link href="/signup" className="text-primary hover:underline">
              {t("login.signUp") || "Cadastre-se"}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginForm />
    </Suspense>
  )
}
