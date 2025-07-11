"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Loader2, Linkedin, AlertTriangle } from "lucide-react"
import { auth } from "@/services/auth/supabase"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useTranslation } from "react-i18next"

export default function LoginPage() {
  const { t } = useTranslation()
  const { user, loading, isAuthenticated, login } = useAuth()

  // Função para traduzir mensagens de erro
  const getErrorMessage = (error: any) => {
    if (!error) return ""
    
    const errorMessage = error.message?.toLowerCase() || ""
    const errorCode = error.code?.toLowerCase() || ""
    
    // Verificar códigos de erro específicos
    if (errorCode === "invalid_credentials" || errorMessage.includes("invalid login credentials")) {
      return t("login.error.invalidCredentials")
    }
    
    // Verificar email não confirmado
    if (errorMessage.includes("email not confirmed") || errorMessage.includes("unconfirmed email")) {
      return t("login.error.emailNotConfirmed")
    }
    
    // Verificar muitas tentativas
    if (errorMessage.includes("too many requests") || errorMessage.includes("rate limit")) {
      return t("login.error.tooManyAttempts")
    }
    
    // Verificar erros de rede
    if (errorMessage.includes("network") || errorMessage.includes("connection") || errorMessage.includes("fetch")) {
      return t("login.error.networkError")
    }
    
    // Verificar usuário não encontrado
    if (errorMessage.includes("user not found") || errorMessage.includes("no user found")) {
      return t("login.error.invalidCredentials")
    }
    
    // Verificar senha incorreta
    if (errorMessage.includes("invalid password") || errorMessage.includes("wrong password")) {
      return t("login.error.invalidCredentials")
    }
    
    // Fallback para mensagens não traduzidas
    return error.message || t("login.error.invalidCredentials")
  }
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false)
  const [isPasswordlessLoading, setIsPasswordlessLoading] = useState(false)
  const [oauthError, setOauthError] = useState("")
  const [passwordlessEmail, setPasswordlessEmail] = useState("")
  const [passwordlessSent, setPasswordlessSent] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const router = useRouter()

  // Redirecionar usuários já logados
  useEffect(() => {
    if (user) {
      // Verificar se usuário precisa selecionar role
      const checkUserRole = async () => {
        try {
          const supabase = createClient()
          const { data: { user: currentUser } } = await supabase.auth.getUser()
          if (currentUser) {
            // Verificar se usuário tem role definida
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', currentUser.id)
              .single()
            
            if (!profile?.role) {
              // Não redirecionar, deixar o AuthGuard lidar com isso
            } else {
              router.push("/")
            }
          }
        } catch (error) {
          router.push("/")
        }
      }
      
      checkUserRole()
    }
  }, [user, router, isAuthenticated])

  // Não renderizar se o usuário está logado
  if (user) {
    return null
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setIsLoggingIn(true)
    
    try {
      await login({ email, password })
      // O AuthProvider vai lidar com o redirecionamento via onAuthStateChange
    } catch (error: any) {
      setLoginError(error.message)
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleGoogleLogin = async () => {
    setOauthError("")
    setIsGoogleLoading(true)
    try {
      await auth.signInWithGoogle()
    } catch (err: any) {
      setOauthError(getErrorMessage(err))
      setIsGoogleLoading(false)
    }
  }

  const handleLinkedInLogin = async () => {
    setOauthError("")
    setIsLinkedInLoading(true)
    try {
      await auth.signInWithLinkedIn()
    } catch (err: any) {
      setOauthError(getErrorMessage(err))
      setIsLinkedInLoading(false)
    }
  }

  const handlePasswordlessLogin = async () => {
    if (!passwordlessEmail) return

    setIsPasswordlessLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signInWithOtp({
        email: passwordlessEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      setPasswordlessSent(true)
    } catch (err: any) {
      setOauthError(getErrorMessage(err))
    } finally {
      setIsPasswordlessLoading(false)
    }
  }

  if (passwordlessSent) {
    return (
      <div className="container max-w-lg py-16 flex flex-col items-center text-center">
        <Card>
          <CardHeader>
            <CardTitle>Link de Acesso Enviado!</CardTitle>
            <CardDescription>Enviamos um link de acesso para {passwordlessEmail}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Próximos passos:</strong>
              </p>
              <ol className="mt-2 list-decimal list-inside text-sm text-blue-700 space-y-1">
                <li>Verifique sua caixa de entrada</li>
                <li>Clique no link de acesso</li>
                <li>Você será redirecionado automaticamente</li>
              </ol>
            </div>
            <p className="text-muted-foreground text-sm">O link expira em 1 hora por segurança.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => setPasswordlessSent(false)} variant="outline">
              Tentar Novamente
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
              disabled={isGoogleLoading || isLinkedInLoading || isLoggingIn}
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
              {isGoogleLoading ? "Conectando..." : "Continuar com Google"}
            </Button>

            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleLinkedInLogin}
              disabled={isGoogleLoading || isLinkedInLoading || isLoggingIn}
            >
              <Linkedin className="mr-2 h-4 w-4 text-[#0077B5]" />
              {isLinkedInLoading ? "Conectando..." : "Continuar com LinkedIn"}
            </Button>

          </div>      

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                 {t("login.continueWith")}
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {(loginError || oauthError) && (
              <div className="rounded-lg bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {oauthError || loginError}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <Button className="w-full" type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Entrando...
                </span>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-center text-sm text-muted-foreground w-full">
            Não tem uma conta?{" "}
            <Link href="/signup" className="text-primary-600 hover:underline">
              Cadastre-se
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
