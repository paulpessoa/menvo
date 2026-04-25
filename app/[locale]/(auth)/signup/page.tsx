"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Loader2, AlertTriangle, Mail, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { WaitingListForm } from "@/components/WaitingListForm"
import { useFeatureFlag } from "@/lib/feature-flags"

function SignupForm() {
  const t = useTranslations("register")
  const tl = useTranslations("login")
  const tc = useTranslations("common")
  const { user, loading, signUp, signInWithProvider, getDefaultRedirectPath } =
    useAuth()
  const waitingListEnabled = useFeatureFlag("waiting_list_flag")

  const isAuthenticated = !!user && !loading
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push(getDefaultRedirectPath())
    }
  }, [isAuthenticated, router, getDefaultRedirectPath])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError(t("passwordValidation.passwordsDontMatch"))
      return
    }

    if (password.length < 6) {
      setError(t("passwordValidation.passwordTooShort"))
      return
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError("Nome e sobrenome são obrigatórios")
      return
    }

    setIsLoading(true)

    try {
      await signUp(email, password, firstName.trim(), lastName.trim())
      setSuccess(true)
      toast.success(t("success"))
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
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
      setError(err.message || t("error.unexpected"))
      toast.error(err.message)
    } finally {
      setIsSocialLoading(null)
    }
  }

  // 🚀 Se a fila de espera estiver ativa, renderiza o componente de WaitingListForm
  if (waitingListEnabled) {
    return (
      <div className="container max-w-5xl py-10 md:py-16 flex justify-center">
        <WaitingListForm />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50/50 py-12 px-4">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="text-center pt-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">{t("confirmEmail")}</CardTitle>
            <CardDescription className="px-6">
              {t("confirmEmailDescription", { email })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-10">
            <p className="text-muted-foreground text-sm text-center">
              {t("afterConfirmation")}
            </p>

            <div className="rounded-2xl bg-yellow-50 p-4 border border-yellow-100">
              <p className="text-xs text-yellow-800 leading-relaxed text-center">
                <strong>{t("didntReceiveEmail")}</strong> {t("checkSpam")}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 px-10 pb-12 pt-4">
            <Button asChild className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
              <Link href="/login">
                {t("goToLogin")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-12 rounded-xl border-2 font-bold">
              <Link href="/">{t("goToHome")}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-secondary/50 via-background to-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border-none shadow-2xl shadow-primary/5 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="space-y-3 text-center pb-8 pt-10">
           <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-2 transform rotate-6">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-gray-900">{t("signupTitle")}</CardTitle>
          <CardDescription className="text-base">{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-8">
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border-2 hover:bg-muted transition-all font-semibold text-gray-700"
              onClick={() => handleSocialLogin("google")}
              disabled={!!isSocialLoading || isLoading}
            >
              {isSocialLoading === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {tl("continueWith")} Google
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
              {tl("continueWith")} LinkedIn
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
              <span className="bg-white px-4 text-muted-foreground">
                {t("orContinueWith")}
              </span>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="rounded-2xl bg-red-50 p-3 border-none flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-xs font-bold text-red-900 leading-tight">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-bold text-gray-700 ml-1">{t("firstName")}</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder={t("firstNamePlaceholder")}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-11 rounded-xl bg-muted/20 border-none focus-visible:ring-primary text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-bold text-gray-700 ml-1">{t("lastName")}</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder={t("lastNamePlaceholder")}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-11 rounded-xl bg-muted/20 border-none focus-visible:ring-primary text-sm"
                  required
                />
              </div>
            </div>

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
              <Label htmlFor="password" title="Crie uma senha segura" className="text-xs font-bold text-gray-700 ml-1">{tc("password")}</Label>
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

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" title="Repita a mesma senha" className="text-xs font-bold text-gray-700 ml-1">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 rounded-xl bg-muted/20 border-none focus-visible:ring-primary text-sm"
                required
              />
            </div>

            <Button className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform mt-4" type="submit" disabled={isLoading || !!isSocialLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  {t("creatingAccount")}
                </span>
              ) : (
                <>
                  <span>{t("registerButton")}</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="pb-10 pt-2">
          <div className="text-center text-sm text-muted-foreground w-full">
            {t("alreadyHaveAccount")}{" "}
            <Link href="/login" className="text-primary hover:underline font-bold">
              {t("signIn")}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function SignupPage() {
  const t = useTranslations("common")
  return (
    <div className="relative">
      <Suspense fallback={<div>{t("loading")}</div>}>
        <SignupForm />
      </Suspense>
    </div>
  )
}
