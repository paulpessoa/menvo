"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Loader2, Github, Linkedin, AlertTriangle, Info } from "lucide-react"
import { UserTypeSelector } from "@/components/auth/UserTypeSelector"
import { auth } from '@/services/auth/supabase'
import { useRouter } from "next/navigation"
import { UserType, useSignupMutation } from '@/hooks/useSignupForm'
import { useTranslation } from "react-i18next"
import { useAuth } from "@/hooks/useAuth"

export default function SignupPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [userType, setUserType] = useState<UserType>("mentee")
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false)
  const [isGitHubLoading, setIsGitHubLoading] = useState(false)
  const [oauthError, setOauthError] = useState("")
  const signupMutation = useSignupMutation()
  const router = useRouter()

  // Redirecionar usuários já logados
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  // Não renderizar se o usuário está logado (evita flash de conteúdo)
  if (user) {
    return null
  }

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    signupMutation.mutate({ email, password, firstName, lastName, userType })
  }

  const handleGoogleSignup = async () => {
    setOauthError("")
    setIsGoogleLoading(true)
    try {
      await auth.signInWithGoogle()
      // O redirecionamento será feito automaticamente pelo OAuth
    } catch (err: any) {
      setOauthError(err?.message || "Google signup failed")
      setIsGoogleLoading(false)
    }
  }

  const handleLinkedInSignup = async () => {
    setOauthError("")
    setIsLinkedInLoading(true)
    try {
      await auth.signInWithLinkedIn()
      // O redirecionamento será feito automaticamente pelo OAuth
    } catch (err: any) {
      setOauthError(err?.message || "LinkedIn signup failed")
      setIsLinkedInLoading(false)
    }
  }

  const handleGitHubSignup = async () => {
    setOauthError("")
    setIsGitHubLoading(true)
    try {
      await auth.signInWithGitHub()
      // O redirecionamento será feito automaticamente pelo OAuth
    } catch (err: any) {
      setOauthError(err?.message || "GitHub signup failed")
      setIsGitHubLoading(false)
    }
  }

  if (signupMutation.status === 'success') {
    return (
      <div className="container max-w-lg py-16 flex flex-col items-center text-center">
        <Card>
          <CardHeader>
            <CardTitle>{t("register.confirmEmail")}</CardTitle>
            <CardDescription>
              {t("register.confirmEmailDescription", { email })}
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
          <CardFooter className="flex justify-center">
            <Link href="/confirmation">
              <Button className="w-full">{t("register.goToVerification")}</Button>
            </Link>
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
          {/* OAuth Buttons */}
          <div className="grid grid-cols-1 gap-2">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleGoogleSignup}
              disabled={isGoogleLoading || isLinkedInLoading || isGitHubLoading || signupMutation.status === 'pending'}
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
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              {isGoogleLoading ? t("login.connecting") : `${t("login.continueWith")} ${t("login.google")}`}
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleLinkedInSignup}
              disabled={isGoogleLoading || isLinkedInLoading || isGitHubLoading || signupMutation.status === 'pending'}
            >
              <Linkedin className="mr-2 h-4 w-4 text-[#0077B5]" />
              {isLinkedInLoading ? t("login.connecting") : `${t("login.continueWith")} ${t("login.linkedin")}`}
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleGitHubSignup}
              disabled={isGoogleLoading || isLinkedInLoading || isGitHubLoading || signupMutation.status === 'pending'}
            >
              <Github className="mr-2 h-4 w-4" />
              {isGitHubLoading ? t("login.connecting") : `${t("login.continueWith")} ${t("login.github")}`}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">{t("register.firstName")}</Label>
                <Input id="first-name" placeholder={t("register.firstNamePlaceholder")} value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">{t("register.lastName")}</Label>
                <Input id="last-name" placeholder={t("register.lastNamePlaceholder")} value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("register.email")}</Label>
              <Input id="email" type="email" placeholder={t("register.emailPlaceholder")} value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("register.password")}</Label>
              <Input id="password" type="password" placeholder={t("register.passwordPlaceholder")} value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <UserTypeSelector userType={userType} setUserType={setUserType} />
            {(signupMutation.status === 'error' || oauthError) && (
              <div className="rounded-lg bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {oauthError || (signupMutation.error as Error)?.message}
                    </h3>
                    {(signupMutation.error as Error)?.message?.includes('over_email_send_rate_limit') && (
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          Por ser uma plataforma gratuita, temos um limite de envio de emails por hora. 
                          Por favor, tente novamente em 1 hora ou entre em contato com nosso suporte se precisar de ajuda imediata.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <Button className="w-full" type="submit" disabled={signupMutation.status === 'pending' || isGoogleLoading || isLinkedInLoading || isGitHubLoading}>
              {signupMutation.status === 'pending' ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  {t("register.creatingAccount")}
                </span>
              ) : (
                <><span>{t("register.registerButton")}</span><ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-center text-sm text-muted-foreground w-full">
            {t("register.alreadyHaveAccount")}{" "}
            <Link href="/login" className="text-primary-600 hover:underline">
              {t("register.signIn")}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 