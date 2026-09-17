"use client"

import { useEffect, useState } from "react"
import { Link, useRouter } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"
import { Loader2, CheckCircle2, Clock } from "lucide-react"

type MembershipStatus = "none" | "requested" | "invited" | "active"

interface Props {
  slug: string
  orgName: string
  joinPolicy: "open" | "invite_only"
}

export function JoinOrganizationButton({ slug, orgName, joinPolicy }: Props) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState<MembershipStatus | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setStatus("none")
      return
    }
    fetch("/api/me/organizations")
      .then(r => r.json())
      .then(json => {
        const row = (json.data ?? []).find((m: any) => m.organizations?.slug === slug)
        setStatus((row?.status as MembershipStatus) ?? "none")
      })
      .catch(() => setStatus("none"))
  }, [user, authLoading, slug])

  const join = async () => {
    setSubmitting(true)
    try {
      const response = await fetch("/api/me/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug })
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || "Não foi possível enviar a solicitação")
      toast.success(json.message)
      setStatus(json.data.status)
      if (json.data.status === "active") router.push("/dashboard")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || status === null) {
    return (
      <Button size="lg" disabled className="mt-2">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3 mt-2">
        <Button asChild size="lg">
          <Link href={`/login?next=/o/${slug}`}>Entrar para participar</Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link href={`/signup?next=/o/${slug}`} className="text-primary font-semibold hover:underline">
            Cadastre-se
          </Link>{" "}
          e volte aqui para solicitar participação.
        </p>
      </div>
    )
  }

  if (status === "active") {
    return (
      <div className="flex flex-col items-center gap-3 mt-2">
        <p className="flex items-center gap-2 text-primary font-semibold">
          <CheckCircle2 className="h-5 w-5" /> Você faz parte da {orgName}
        </p>
        <Button asChild size="lg" variant="outline">
          <Link href="/mentors">Encontrar um mentor</Link>
        </Button>
      </div>
    )
  }

  if (status === "requested") {
    return (
      <p className="flex items-center gap-2 text-muted-foreground mt-2">
        <Clock className="h-5 w-5" /> Solicitação enviada — aguardando aprovação da organização
      </p>
    )
  }

  if (status !== "invited" && joinPolicy === "invite_only") {
    return (
      <p className="text-muted-foreground mt-2 text-center max-w-[400px]">
        Esta organização entra apenas por convite. Peça a um administrador dela pra te convidar.
      </p>
    )
  }

  return (
    <Button size="lg" className="mt-2" onClick={join} disabled={submitting}>
      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
      {status === "invited" ? "Aceitar convite" : "Solicitar participação"}
    </Button>
  )
}
