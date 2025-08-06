"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Github, Chrome, Linkedin } from 'lucide-react'
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { useRouter } from "next/navigation"
import UserTypeSelector from "@/components/auth/UserTypeSelector"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [userType, setUserType] = useState<"mentee" | "mentor" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signUpWithEmail, signInWithOAuth } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (password !== confirmPassword) {
      toast({
        title: "Erro de validação",
        description: "As senhas não coincidem.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (!userType) {
      toast({
        title: "Selecione um tipo de usuário",
        description: "Por favor, escolha se você é um mentor ou um mentee.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await signUpWithEmail(email, password, userType)

      if (error) {
        throw error
      }

      toast({
        title: "Cadastro bem-sucedido!",
        description: "Verifique seu e-mail para confirmar sua conta.",
        variant: "default",
      })
      router.push("/confirmation")
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao tentar se cadastrar. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOAuthSignIn = async (provider: "google" | "github" | "linkedin") => {
    setIsSubmitting(true)
    try {
      const { error } = await signInWithOAuth(provider)
      if (error) {
        throw error
      }
      // Supabase handles redirection for OAuth, so no explicit push here
    } catch (error: any) {
      toast({
        title: "Erro no cadastro com " + provider,
        description: error.message || "Ocorreu um erro ao tentar se cadastrar com " + provider + ". Tente novamente.",
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
          <CardTitle className="text-2xl font-bold">Cadastre-se</CardTitle>
          <CardDescription>
            Crie sua conta para começar sua jornada de mentoria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-4">
              <Button variant="outline" onClick={() => handleOAuthSignIn("google")} disabled={isSubmitting}>
                <Chrome className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button variant="outline" onClick={() => handleOAuthSignIn("github")} disabled={isSubmitting}>
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
              <Button variant="outline" onClick={() => handleOAuthSignIn("linkedin")} disabled={isSubmitting}>
                <Linkedin className="mr-2 h-4 w-4" />
                LinkedIn
              </Button>
            </div>
            <Separator className="my-4">OU</Separator>
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
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <UserTypeSelector selectedType={userType} onSelectType={setUserType} />
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" required />
                <Label htmlFor="terms" className="text-sm font-normal">
                  Eu concordo com os{" "}
                  <Link href="/terms" className="underline">
                    Termos de Serviço
                  </Link>{" "}
                  e a{" "}
                  <Link href="/privacy" className="underline">
                    Política de Privacidade
                  </Link>
                  .
                </Label>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </form>
          </div>
          <div className="mt-4 text-center text-sm">
            Já tem uma conta?{" "}
            <Link href="/login" className="underline">
              Entrar
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
