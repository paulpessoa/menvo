"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from 'lucide-react'
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { useRouter, useSearchParams } from "next/navigation"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const { updateUserPassword } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const accessToken = searchParams.get('access_token')

  useEffect(() => {
    if (!accessToken) {
      setMessage("Token de redefinição de senha ausente ou inválido.")
      toast({
        title: "Erro",
        description: "Token de redefinição de senha ausente ou inválido.",
        variant: "destructive",
      })
    }
  }, [accessToken, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage("")

    if (password !== confirmPassword) {
      setMessage("As senhas não coincidem.")
      toast({
        title: "Erro de validação",
        description: "As senhas digitadas não coincidem.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (!accessToken) {
      setMessage("Não foi possível redefinir a senha: token ausente.")
      toast({
        title: "Erro",
        description: "Não foi possível redefinir a senha: token ausente.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await updateUserPassword(password)

      if (error) {
        throw error
      }

      setMessage("Sua senha foi redefinida com sucesso! Você pode fazer login agora.")
      toast({
        title: "Senha redefinida!",
        description: "Sua senha foi atualizada com sucesso.",
        variant: "default",
      })
      router.push("/login")
    } catch (error: any) {
      setMessage(error.message || "Ocorreu um erro ao redefinir a senha.")
      toast({
        title: "Erro ao redefinir senha",
        description: error.message || "Não foi possível redefinir sua senha. Tente novamente.",
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
          <CardTitle className="text-2xl font-bold">Redefinir Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || !accessToken}>
              {isSubmitting ? "Redefinindo..." : "Redefinir Senha"}
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
