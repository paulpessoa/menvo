"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from 'lucide-react'
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const { resetPasswordForEmail } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage("")

    try {
      const { error } = await resetPasswordForEmail(email)

      if (error) {
        throw error
      }

      setMessage("Se um usuário com este e-mail existir, um link de redefinição de senha foi enviado para ele.")
      toast({
        title: "E-mail de redefinição enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
        variant: "default",
      })
    } catch (error: any) {
      setMessage(error.message || "Ocorreu um erro ao solicitar a redefinição de senha.")
      toast({
        title: "Erro ao enviar e-mail",
        description: error.message || "Não foi possível enviar o e-mail de redefinição. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Esqueceu sua senha?</CardTitle>
          <CardDescription>
            Digite seu e-mail abaixo para receber um link de redefinição de senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Redefinir Senha"}
            </Button>
            {message && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                {message}
              </p>
            )}
          </form>
          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="inline-flex items-center gap-1 underline">
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
