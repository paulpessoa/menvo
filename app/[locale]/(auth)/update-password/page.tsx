"use client"

import type React from "react"
import { useState, Suspense, useEffect } from "react"
import { useRouter } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, CheckCircle2, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/utils/supabase/client"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { debugLog } from "@/lib/debug-logger"

function UpdatePasswordForm() {
  const t = useTranslations("login")
  const { user, loading: authLoading } = useAuth()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    debugLog("UpdatePassword landed", { 
        hasUser: !!user, 
        userEmail: user?.email,
        authLoading 
    })
  }, [user, authLoading])

  if (authLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse text-lg">Validando sua sessão segura...</p>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="w-full max-w-md border-amber-100 bg-amber-50/30">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle className="text-amber-800">Sessão Expirada ou Inválida</CardTitle>
          <CardDescription>
            Para sua segurança, o link de recuperação de senha só é válido por um curto período e para um único uso.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={() => router.push("/forgot-password")} className="w-full" variant="outline">
                Solicitar novo link de recuperação
            </Button>
        </CardContent>
      </Card>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.")
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess(true)
      toast.success("Senha atualizada com sucesso!")
      
      // Redireciona após 3 segundos
      setTimeout(() => {
        router.push("/login")
      }, 3000)

    } catch (err: any) {
      console.error("Error updating password:", err)
      setError(err.message || "Erro ao atualizar a senha.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md border-green-100 bg-green-50/30">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-green-800 text-2xl">Senha Atualizada!</CardTitle>
          <CardDescription className="text-base">
            Sua nova senha foi salva. Você será redirecionado para o login em instantes...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-2xl border-2">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-primary">Crie sua nova senha</CardTitle>
        <CardDescription className="text-center">
          Digite e confirme sua nova senha de acesso abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Atualizando...
              </>
            ) : (
              "Salvar Nova Senha"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
        <UpdatePasswordForm />
      </Suspense>
    </div>
  )
}
