"use client"

import React, { useState } from "react"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ClipboardList, CheckCircle } from "lucide-react"
import { useTranslations } from "next-intl"

interface WaitingListFormProps {
  onSuccess?: () => void
}

/**
 * Formulário de inscrição na lista de espera.
 * UI alinhada ao padrão dos formulários de login e cadastro:
 * card arredondado, inputs limpos, botão com sombra brand.
 */
export function WaitingListForm({ onSuccess }: WaitingListFormProps) {
  const t = useTranslations()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!name.trim()) {
      setError("Nome é obrigatório")
      setIsLoading(false)
      return
    }
    if (!email.trim()) {
      setError("E-mail é obrigatório")
      setIsLoading(false)
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("E-mail inválido")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/waiting-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          whatsapp: whatsapp.trim() || null,
          reason: reason.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(
          response.status === 409
            ? "Este e-mail já está cadastrado na lista de espera"
            : data.error || "Erro ao se inscrever na lista de espera"
        )
        return
      }

      setSuccess(true)
      onSuccess?.()
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  /* ── Estado de sucesso ──────────────────────────────────────────── */
  if (success) {
    return (
      <Card className="w-full max-w-md border-none shadow-2xl shadow-primary/5 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="space-y-3 text-center pb-6 pt-10">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-2">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight text-foreground">
            {t("waitingList.successMessage")}
          </CardTitle>
          <CardDescription className="text-base">
            Você entrou na lista! Entraremos em contato em breve.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-4">
          <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4 space-y-2">
            <h4 className="text-sm font-bold text-foreground">Próximos passos</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Verifique seu e-mail de confirmação</li>
              <li>• Nossa equipe analisará sua inscrição</li>
              <li>• Avisamos assim que houver vagas disponíveis</li>
              <li>• Fique de olho no e-mail e WhatsApp</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="pb-10 px-8">
          <Button asChild className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20">
            <Link href="/">Voltar ao início</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  /* ── Formulário ─────────────────────────────────────────────────── */
  return (
    <Card className="w-full max-w-md border-none shadow-2xl shadow-primary/5 rounded-[2.5rem] overflow-hidden">
      <CardHeader className="space-y-3 text-center pb-8 pt-10">
        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-2 transform rotate-6">
          <ClipboardList className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-3xl font-extrabold tracking-tight text-foreground">
          {t("waitingList.title")}
        </CardTitle>
        <CardDescription className="text-base">
          {t("waitingList.description")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 px-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-bold text-muted-foreground ml-1">
              {t("waitingList.nameLabel")}
            </Label>
            <Input
              id="name"
              type="text"
              placeholder={t("waitingList.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl bg-muted/20 border-none focus-visible:ring-primary text-sm"
              required
            />
          </div>

          {/* E-mail */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold text-muted-foreground ml-1">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t("waitingList.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl bg-muted/20 border-none focus-visible:ring-primary text-sm"
              required
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp" className="text-xs font-bold text-muted-foreground ml-1">
              {t("waitingList.whatsappLabel")}
            </Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder={t("waitingList.whatsappPlaceholder")}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="h-11 rounded-xl bg-muted/20 border-none focus-visible:ring-primary text-sm"
            />
          </div>

          {/* Motivo */}
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-bold text-muted-foreground ml-1">
              {t("waitingList.reasonLabel")}
            </Label>
            <Textarea
              id="reason"
              placeholder={t("waitingList.reasonPlaceholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-xl bg-muted/20 border-none focus-visible:ring-primary text-sm min-h-[88px] resize-none"
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-2xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enviando...
              </span>
            ) : (
              "Entrar na Lista de Espera"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="pb-10 pt-2">
        <div className="text-center text-sm text-muted-foreground w-full">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-primary hover:underline font-bold">
            Faça login
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}


