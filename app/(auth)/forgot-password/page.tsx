"use client"

import type React from "react"

import { useState, Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail, Loader2, AlertTriangle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/client"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

function ForgotPasswordForm() {
  const { t } = useTranslation()
  const auth = useAuth()

  const resetPassword = async (email: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    if (error) throw error
  }
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await resetPassword(email)
      setIsSuccess(true)
      toast.success("Email de recuperação enviado!")
    } catch (err: any) {
      setError(err?.message || "Erro ao enviar email de recuperação")
      toast.error(err?.message || "Erro ao enviar email de recuperação")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="container flex py-16 max-w-screen-xl flex-col items-center justify-center">
        <Card className="mx-auto max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Email enviado!</CardTitle>
            <CardDescription>
              Enviamos um link de recuperação para <span className="font-semibold">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Próximos passos:</strong>
              </p>
              <ol className="mt-2 list-decimal list-inside text-sm text-blue-700 space-y-1">
                <li>Verifique sua caixa de entrada</li>
                <li>Clique no link de recuperação</li>
                <li>Crie uma nova senha</li>
              </ol>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => {
                setIsSuccess(false)
                setEmail("")
              }}
            >
              Tentar outro email
            </Button>
            <Link href="/login" className="w-full">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex py-16 max-w-screen-xl flex-col items-center justify-center">
      <Card className="mx-auto max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Esqueci minha senha</CardTitle>
          <CardDescription>Digite seu e-mail para receber um link de recuperação</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Enviando...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar link de recuperação
                </span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  )
}
