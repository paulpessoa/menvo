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
import { ArrowRight, Loader2, AlertTriangle, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { WaitingList } from "@/components/WaitingList"

function SignupForm() {
  const { t } = useTranslation()
  const { user, role, loading, signUp, signInWithProvider } = useAuth()

  const isAuthenticated = !!user && !loading
  const needsRoleSelection = () => user && !role
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      if (needsRoleSelection()) {
        router.push("/onboarding/role-selection")
      } else {
        router.push("/dashboard")
      }
    }
  }, [isAuthenticated, needsRoleSelection, router])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError(t("register.passwordValidation.passwordsDontMatch"))
      return
    }

    if (password.length < 6) {
      setError(t("register.passwordValidation.passwordTooShort"))
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
      toast.success(t("register.success"))
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError("")
    setIsGoogleLoading(true)
    try {
      await signInWithProvider('google')
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
      setIsGoogleLoading(false)
    }
  }

  const handleLinkedInSignup = async () => {
    setError("")
    setIsLinkedInLoading(true)
    try {
      await signInWithProvider('linkedin')
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
      setIsLinkedInLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container max-w-lg py-16 flex flex-col items-center text-center">
        <Card>
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>{t("register.confirmEmail")}</CardTitle>
            <CardDescription>
              {t("register.confirmEmailDescription", { email }) ||
                `Enviamos um link de confirmação para ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              {t("register.afterConfirmation")}
            </p>

            <div className="rounded-lg bg-yellow-50 p-3">
              <p className="text-xs text-yellow-800">
                <strong>{t("register.didntReceiveEmail")}</strong>{" "}
                {t("register.checkSpam")}
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
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/">{t("register.goToHome")}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl py-10 md:py-16">
      <Card className="mx-auto max-w-md">
        <CardHeader className="flex flex-col items-center">
          <CardTitle>{t("register.signupTitle")}</CardTitle>
          <CardDescription>{t("register.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleGoogleSignup}
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
              {isGoogleLoading
                ? t("login.connecting")
                : `${t("login.continueWith")} Google`}
            </Button>

            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleLinkedInSignup}
              disabled={isGoogleLoading || isLinkedInLoading || isLoading}
            >
              {isLinkedInLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" fill="#0A66C2" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              )}
              {isLinkedInLoading
                ? t("login.connecting")
                : `${t("login.continueWith")} LinkedIn`}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("register.orContinueWith")}
              </span>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 border border-red-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("register.firstName")}</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder={t("register.firstNamePlaceholder")}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t("register.lastName")}</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder={t("register.lastNamePlaceholder")}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("register.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("register.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("register.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("register.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t("register.confirmPassword")}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("register.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  {t("register.creatingAccount")}
                </span>
              ) : (
                <>
                  <span>{t("register.registerButton")}</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-center text-sm text-muted-foreground w-full">
            {t("register.alreadyHaveAccount")}{" "}
            <Link href="/login" className="text-primary hover:underline">
              {t("register.signIn")}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function SignupPage() {
  return (
    <div className="relative">
      {/* TODO: Adicionar tradução */}
      <Suspense fallback={<div>Carregando...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  )
}
