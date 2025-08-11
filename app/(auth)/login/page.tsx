"use client"

import type * as React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { auth } from "@/services/auth/supabase"

/**
 * Tela de Login
 * - Mantém login por e-mail/senha
 * - Adiciona botões de Google e LinkedIn, como na tela de registro
 * TODO: Ajustar textos/i18n conforme necessidade do projeto.
 */

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // Login com senha exige e-mail confirmado no Supabase (GoTrue)
      await auth.signIn(email, password)
      const redirect = searchParams.get("redirect") || "/dashboard"
      router.push(redirect)
    } catch (err: any) {
      // Mensagem amigável para e-mail não confirmado
      if (err?.message?.toLowerCase()?.includes("email not confirmed")) {
        setError("Por favor, confirme seu e-mail antes de fazer login.")
      } else {
        setError(err?.message || "Erro ao fazer login.")
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    setLoading(true)
    try {
      await auth.signInWithGoogle()
      // Redireciona automaticamente via OAuth
    } catch (err: any) {
      setError(err?.message || "Erro ao iniciar login com Google.")
      setLoading(false)
    }
  }

  async function handleLinkedIn() {
    setError(null)
    setLoading(true)
    try {
      await auth.signInWithLinkedIn()
      // Redireciona automaticamente via OAuth
    } catch (err: any) {
      setError(err?.message || "Erro ao iniciar login com LinkedIn.")
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
          <p className="text-sm text-muted-foreground">Acesse sua conta para continuar.</p>
        </div>

        <div className="grid gap-3">
          <Button variant="outline" onClick={handleGoogle} disabled={loading}>
            {/* Comentário: Ícone pode ser melhorado com imagem da marca, aqui usamos um ícone genérico */}
            Entrar com Google
          </Button>
          <Button variant="outline" onClick={handleLinkedIn} disabled={loading}>
            Entrar com LinkedIn
          </Button>
        </div>

        <div className="relative">
          <Separator />
          <div className="absolute inset-0 -mt-3 flex justify-center">
            <span className="bg-background px-2 text-xs text-muted-foreground">ou continue com e-mail</span>
          </div>
        </div>

        <form onSubmit={handleEmailLogin} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Sua senha segura"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Ao continuar, você concorda com nossos Termos e Política de Privacidade.
        </p>
      </div>
    </main>
  )
}
