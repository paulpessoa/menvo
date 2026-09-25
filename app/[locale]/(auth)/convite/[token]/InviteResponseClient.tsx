"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Heart, GraduationCap, MailX, Trash2, CheckCircle2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

interface InviteResponseClientProps {
  token: string
  firstName: string
  alreadyResponded: string | null
}

type View = "main" | "delete-confirm" | "deleted" | "opted-out"

const RESPONSE_LABEL: Record<string, string> = {
  accepted: "Você já acessou este convite.",
  accepted_mentor: "Você já acessou este convite (como futuro(a) mentor(a)).",
  opted_out: "Você já pediu para não receber mais e-mails.",
  deleted: "Seus dados já foram apagados."
}

/**
 * Botões de ação do convite. Cada um dispara um POST só no clique — abrir
 * esta página nunca executa nada (ver page.tsx e §3.2 do design doc).
 */
export function InviteResponseClient({ token, firstName, alreadyResponded }: InviteResponseClientProps) {
  const searchParams = useSearchParams()
  const intent = searchParams.get("intent")
  const [view, setView] = useState<View>("main")
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const respond = async (action: "accept" | "accept_mentor" | "opt_out") => {
    setLoadingAction(action)
    try {
      const res = await fetch("/api/invites/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error === "already_responded" ? "Este convite já foi respondido." : "Não foi possível processar sua resposta.")

      if (action === "opt_out") {
        setView("opted-out")
      } else {
        window.location.href = data.redirectUrl
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro inesperado")
      setLoadingAction(null)
    }
  }

  const confirmDelete = async () => {
    setLoadingAction("delete")
    try {
      const res = await fetch("/api/invites/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, confirm: true })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error === "already_responded" ? "Este convite já foi respondido." : "Não foi possível apagar seus dados agora.")
      setView("deleted")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro inesperado")
    } finally {
      setLoadingAction(null)
    }
  }

  if (alreadyResponded && view === "main") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{RESPONSE_LABEL[alreadyResponded] || "Você já respondeu este convite."}</CardTitle>
          <CardDescription>Se precisar de algo, é só entrar em contato ou fazer login normalmente.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (view === "opted-out") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MailX className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Combinado, {firstName}.</CardTitle>
          <CardDescription>Você não vai mais receber e-mails da Menvo. Seus dados continuam guardados caso mude de ideia — se preferir apagá-los também, é só voltar aqui.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (view === "deleted") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ShieldCheck className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Pronto, {firstName}.</CardTitle>
          <CardDescription>Seus dados e seu perfil foram apagados definitivamente da Menvo. Obrigado por ter feito parte da nossa história.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (view === "delete-confirm") {
    return (
      <Card className="w-full max-w-md border-red-100">
        <CardHeader>
          <CardTitle className="text-red-800">Tem certeza, {firstName}?</CardTitle>
          <CardDescription>Esta ação não pode ser desfeita.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-red-800">Será apagado para sempre:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-0.5">
              <li>Seu perfil e conta de acesso</li>
              <li>As respostas importadas do formulário do Estágio Recife</li>
              <li>Currículo e foto, se houver</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">O que fica:</p>
            <p className="text-muted-foreground">Apenas um registro sem nenhum dado seu, provando que seu pedido foi atendido.</p>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button variant="destructive" className="w-full gap-2" onClick={confirmDelete} disabled={loadingAction === "delete"}>
            {loadingAction === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Sim, apagar definitivamente
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setView("main")} disabled={loadingAction === "delete"}>
            Cancelar
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Olá, {firstName}!</CardTitle>
        <CardDescription>
          A Menvo é uma extensão do Estágio Recife: mentoria de carreira gratuita. Você não precisa saber quem pode
          te ajudar, você só precisa saber o que quer conversar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          className="w-full gap-2"
          onClick={() => respond("accept")}
          disabled={loadingAction !== null}
          variant={intent === "mentor" || intent === "optout" ? "outline" : "default"}
        >
          {loadingAction === "accept" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
          Quero acessar e completar meu perfil
        </Button>
        <Button
          className="w-full gap-2"
          variant={intent === "mentor" ? "default" : "outline"}
          onClick={() => respond("accept_mentor")}
          disabled={loadingAction !== null}
        >
          {loadingAction === "accept_mentor" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
          Quero apoiar como mentor(a)
        </Button>
      </CardContent>
      <CardFooter className="flex-col gap-2 border-t pt-4">
        <p className="text-xs text-muted-foreground text-center">Prefere não participar?</p>
        <Button
          className="w-full gap-2"
          variant={intent === "optout" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => respond("opt_out")}
          disabled={loadingAction !== null}
        >
          {loadingAction === "opt_out" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailX className="h-4 w-4" />}
          Parar de receber e-mails
        </Button>
        <Button
          className="w-full gap-2 text-muted-foreground"
          variant="ghost"
          size="sm"
          onClick={() => setView("delete-confirm")}
          disabled={loadingAction !== null}
        >
          <Trash2 className="h-4 w-4" />
          Apagar meus dados e meu perfil
        </Button>
      </CardFooter>
    </Card>
  )
}
