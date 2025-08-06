"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Loader2, Github, Linkedin, AlertTriangle } from 'lucide-react'
import { UserTypeSelector } from "@/components/auth/UserTypeSelector"
import { supabase, auth } from '@/services/auth/supabase'
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useTranslation } from "react-i18next"

type UserType = "mentee" | "mentor"

export default function SignupPage() {
  const { t } = useTranslation()
  const { user, isLoading: isAuthLoading } = useAuth()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [userType, setUserType] = useState<UserType>("mentee")
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const router = useRouter()

  useEffect(() => {
    if (!isAuthLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isAuthLoading, router])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          user_type: userType,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setIsSuccess(true)
    }
    setIsLoading(false)
  }

  const handleOAuthSignup = async (provider: 'google' | 'linkedin_oidc' | 'github') => {
    setIsLoading(true)
    setError(null)
    await auth.signInWithOAuth(provider, userType)
    setIsLoading(false)
  }

  if (isSuccess) {
    return (
      <div className="container max-w-lg py-16 flex flex-col items-center text-center">
        <Card>
          <CardHeader>
            <CardTitle>{t("register.confirmEmail")}</CardTitle>
            <CardDescription>
              {t("register.confirmEmailDescription", { email })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {t("register.afterConfirmation")}
            </p>
          </CardContent>
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
            <Button variant="outline" onClick={() => handleOAuthSignup('google')} disabled={isLoading}>
              {/* Google SVG */}
              {isLoading ? t("login.connecting") : `${t("login.continueWith")} ${t("login.google")}`}
            </Button>
            <Button variant="outline" onClick={() => handleOAuthSignup('linkedin_oidc')} disabled={isLoading}>
              <Linkedin className="mr-2 h-4 w-4 text-[#0077B5]" />
              {isLoading ? t("login.connecting") : `${t("login.continueWith")} ${t("login.linkedin")}`}
            </Button>
            <Button variant="outline" onClick={() => handleOAuthSignup('github')} disabled={isLoading}>
              <Github className="mr-2 h-4 w-4" />
              {isLoading ? t("login.connecting") : `${t("login.continueWith")} ${t("login.github")}`}
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
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <><span>{t("register.registerButton")}</span><ArrowRight className="ml-2 h-4 w-4" /></>
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
