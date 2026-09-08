"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { Separator } from "@/components/ui/separator"
import { useTranslations } from "next-intl"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  )
}

function LoginFormContent() {
  const t = useTranslations("login")
  const tc = useTranslations("common")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams.get("next")
  const { signIn, signInWithProvider, user, role, loading, isInitializing, getDefaultRedirectPath } = useAuth()

  const isAuthenticated = !!user && !loading && !isInitializing

  useEffect(() => {
    if (isAuthenticated) {
      const target = nextParam && nextParam.startsWith("/") && !nextParam.includes("/login")
        ? nextParam
        : getDefaultRedirectPath()
      router.push(target)
    }
  }, [isAuthenticated, router, getDefaultRedirectPath, nextParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await signIn(email, password)
      if (res && !res.success && res.error) {
        const msg = (res.error as any)?.message || ""
        if (msg.includes("Email not confirmed")) {
          setError("email_not_confirmed")
        } else if (msg.includes("Invalid login credentials")) {
          setError(t("error.invalidCredentials"))
        } else {
          setError(msg || t("error.unexpected"))
        }
        return
      }

      // Redireciona com destino seguro se o signIn foi síncrono
      const target = nextParam && nextParam.startsWith("/") && !nextParam.includes("/login")
        ? nextParam
        : getDefaultRedirectPath()
      router.push(target)
    } catch (err: any) {
      console.error("Login error:", err)
      if (err.message?.includes("Email not confirmed")) {
        setError("email_not_confirmed")
      } else {
        setError(err.message || t("error.unexpected"))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: "google" | "linkedin") => {
    setIsSocialLoading(provider)
    setError("")

    try {
      await signInWithProvider(provider)
    } catch (err: any) {
      setError(err.message || t("error.loginFailed"))
    } finally {
      setIsSocialLoading(null)
    }
  }

  return (
    <Card className="w-full max-w-md border-none shadow-2xl shadow-primary/5 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="space-y-3 text-center pb-8 pt-10">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-2 transform rotate-6">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-gray-900">{tc("welcome")}</CardTitle>
          <CardDescription className="text-base">{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-8">
          {/* Layout Vertical (Stacked) */}
          <div className="grid grid-cols-1 gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border-2 hover:bg-muted transition-all font-semibold text-gray-700"
              onClick={() => handleSocialLogin("google")}
              disabled={!!isSocialLoading || isLoading}
            >
              {isSocialLoading === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              {t("continueWith")} Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border-2 hover:bg-muted transition-all font-semibold text-gray-700"
              onClick={() => handleSocialLogin("linkedin")}
              disabled={!!isSocialLoading || isLoading}
            >
              {isSocialLoading === "linkedin" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" fill="#0A66C2" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              )}
              {t("continueWith")} LinkedIn
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
              <span className="bg-white px-4 text-muted-foreground">{t("orContinueWith")}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-gray-700 ml-1">{tc("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl bg-muted/20 border-none focus-visible:ring-primary text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" title="Sua senha de acesso" className="text-xs font-bold text-gray-700 ml-1">{tc("password")}</Label>
                <Link href="/forgot-password" className="text-xs font-bold text-primary hover:underline">
                  {t("forgotPassword")}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl bg-muted/20 border-none focus-visible:ring-primary text-sm"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform mt-4"
              disabled={isLoading || !!isSocialLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t("loggingIn")}
                </span>
              ) : (
                t("loginButton")
              )}
            </Button>

            {error && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertDescription className="flex flex-col gap-2">
                  {error === "email_not_confirmed" ? (
                    <>
                      <span>{t("error.emailNotConfirmed")}</span>
                      <Link 
                        href="/resend-confirmation" 
                        className="text-xs font-bold underline hover:opacity-80"
                      >
                        {t("error.resendConfirmation")}
                      </Link>
                    </>
                  ) : (
                    error
                  )}
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
        <CardFooter className="pb-10 pt-2">
          <div className="text-center text-sm text-muted-foreground w-full">
            {t("dontHaveAccount")}{" "}
            <Link href="/signup" className="text-primary hover:underline font-bold">
              {tc("register")}
            </Link>
          </div>
        </CardFooter>
      </Card>
  )
}
