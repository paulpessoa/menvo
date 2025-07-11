"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Loader2, Linkedin, AlertTriangle, Info, Mail, User } from "lucide-react"
import { auth } from '@/services/auth/supabase'
import { useRouter } from "next/navigation"
import { useSignupMutation } from '@/hooks/useSignupForm'
import { useTranslation } from "react-i18next"
import { useAuth } from "@/hooks/useAuth"


export default function SignupPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false)
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
    
    // Validar se as senhas coincidem
    if (password !== confirmPassword) {
      setOauthError(t("register.passwordValidation.passwordsDontMatch"))
      return
    }
    
    // Validar se a senha tem pelo menos 6 caracteres
    if (password.length < 6) {
      setOauthError(t("register.passwordValidation.passwordTooShort"))
      return
    }
    
    signupMutation.mutate({ email, password })
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

  if (signupMutation.status === 'success') {
    return (
      <div className="container max-w-lg py-16 flex flex-col items-center text-center">
        <Card>
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>{t("register.confirmEmail")}</CardTitle>
            <CardDescription>
              {t("register.confirmEmailDescription", { email })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
      
            {/* Next Steps */}
          
            
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
          {/* OAuth Buttons */}
          <div className="grid grid-cols-1 gap-2">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleGoogleSignup}
              disabled={isGoogleLoading || isLinkedInLoading || signupMutation.status === 'pending'}
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
              disabled={isGoogleLoading || isLinkedInLoading || signupMutation.status === 'pending'}
            >
              <Linkedin className="mr-2 h-4 w-4 text-[#0077B5]" />
              {isLinkedInLoading ? t("login.connecting") : `${t("login.continueWith")} ${t("login.linkedin")}`}
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
            
            {/* Exibir erro de validação */}
            {oauthError && (
              <div className="rounded-lg bg-red-50 p-3 border border-red-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-800">{oauthError}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">{t("register.email")}</Label>
              <Input id="email" type="email" placeholder={t("register.emailPlaceholder")} value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("register.password")}</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder={t("register.passwordPlaceholder")} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className={password.length > 0 && password.length < 6 ? "border-yellow-500 focus:border-yellow-500" : ""}
              />
              {password.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("register.passwordValidation.passwordStrength")}</p>
                  <div className="flex gap-1">
                    <div className={`h-1 flex-1 rounded ${password.length >= 6 ? 'bg-green-500' : password.length >= 4 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    <div className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-green-500' : password.length >= 6 ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                    <div className={`h-1 flex-1 rounded ${password.length >= 10 ? 'bg-green-500' : password.length >= 8 ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {password.length < 6 ? t("register.passwordValidation.passwordTooWeak") : password.length < 8 ? t("register.passwordValidation.passwordMedium") : t("register.passwordValidation.passwordStrong")}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("register.confirmPassword")}</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder={t("register.confirmPasswordPlaceholder")} 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
                className={confirmPassword && password !== confirmPassword ? "border-red-500 focus:border-red-500" : ""}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-600">{t("register.passwordValidation.passwordsDontMatchError")}</p>
              )}
              {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
                <p className="text-xs text-green-600">{t("register.passwordValidation.passwordsMatch")}</p>
              )}
            </div>
            <Button className="w-full" type="submit" disabled={signupMutation.status === 'pending' || isGoogleLoading || isLinkedInLoading }>
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
