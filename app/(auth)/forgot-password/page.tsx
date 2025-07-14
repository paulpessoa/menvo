"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!email) {
      setError("Email é obrigatório")
      setLoading(false)
      return
    }

    try {
      await resetPassword(email)
      setSuccess(true)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthGuard requireAuth={false}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Mail className="mx-auto h-12 w-12 text-green-600" />
              <CardTitle>Email enviado</CardTitle>
              <CardDescription>
                Enviamos um link de recuperação para <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center mb-4">
                Clique no link do email para redefinir sua senha.
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Voltar para Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Recuperar Senha</CardTitle>
            <CardDescription>Digite seu email para receber um link de recuperação</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Link de Recuperação"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500">
                Voltar para Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}
