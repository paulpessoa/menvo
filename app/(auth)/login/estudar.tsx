"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Github, Linkedin } from "lucide-react"
import { auth } from '@/services/auth/supabase'
import { EmailConfirmationBanner } from '@/components/auth/EmailConfirmationBanner'
import { useTranslation } from "react-i18next"
import { useAuth } from "@/hooks/useAuth"

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false)
  const [isGitHubLoading, setIsGitHubLoading] = useState(false)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      // await login({ email, password })
       await auth.signIn(email, password)
             router.push('/')

    } catch (err: any) {
      setError(err?.message || "Login failed")
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'linkedin' | 'github') => {
    setError("")
    const loadingState = {
      google: setIsGoogleLoading,
      linkedin: setIsLinkedInLoading,
      github: setIsGitHubLoading
    }[provider]
    
    loadingState(true)
    try {
      const res = await fetch(`/api/auth/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `${provider} login failed`)
      }
      
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err?.message || `${provider} login failed`)
      loadingState(false)
    }
  }

  return (
    <div className="container max-w-5xl py-10 md:py-16">
      <Card className="mx-auto max-w-md">
        <CardHeader className="flex flex-col items-center">
          <CardTitle>{t("login.title")}</CardTitle>
          <CardDescription>{t("login.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EmailConfirmationBanner />
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.email")}</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder={t("login.emailPlaceholder")} 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("login.password")}</Label>
                <Link href="/forgot-password" className="text-sm text-primary-600 hover:underline">
                  {t("login.forgotPassword")}
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? t("login.loggingIn") : t("login.loginButton")}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link href="/signup" className="text-primary-600 hover:underline">
              {t("login.signUp")}
            </Link>
          </div>
          <Separator />
          <div className="grid grid-cols-1 gap-2">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => handleSocialLogin('google')}
              disabled={isGoogleLoading || isLinkedInLoading || isGitHubLoading}
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
              onClick={() => handleSocialLogin('linkedin')}
              disabled={isGoogleLoading || isLinkedInLoading || isGitHubLoading}
            >
              <Linkedin className="mr-2 h-4 w-4 text-[#0077B5]" />
              {isLinkedInLoading ? t("login.connecting") : `${t("login.continueWith")} ${t("login.linkedin")}`}
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleSocialLogin('github')}
              disabled={isGoogleLoading || isLinkedInLoading || isGitHubLoading}
            >
              <Github className="mr-2 h-4 w-4" />
              {isGitHubLoading ? t("login.connecting") : `${t("login.continueWith")} ${t("login.github")}`}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
