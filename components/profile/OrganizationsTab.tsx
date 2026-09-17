"use client"

import { useCallback, useEffect, useState } from "react"
import { Link } from "@/i18n/routing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Check, Loader2, LogOut, X } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"

interface Membership {
  organization_id: string
  role: "admin" | "member"
  status: "invited" | "requested" | "active"
  organizations: { id: string; slug: string; name: string; type: string; status: string } | null
}

export function OrganizationsTab() {
  const { cachedRoles } = useAuth()
  const isMentor = cachedRoles?.mentor === true
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/me/organizations")
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || "Falha ao carregar organizações")
      setMemberships((json.data ?? []).filter((m: Membership) => m.organizations))
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const accept = async (m: Membership) => {
    setBusyId(m.organization_id)
    try {
      const response = await fetch("/api/me/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: m.organizations!.slug })
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || "Não foi possível aceitar o convite")
      toast.success(json.message)
      await load()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setBusyId(null)
    }
  }

  const leave = async (m: Membership) => {
    setBusyId(m.organization_id)
    try {
      const response = await fetch(`/api/me/organizations?organizationId=${m.organization_id}`, {
        method: "DELETE"
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || "Não foi possível sair")
      toast.success(
        m.status === "invited"
          ? "Convite recusado"
          : m.status === "requested"
            ? "Solicitação cancelada"
            : "Você saiu da organização"
      )
      await load()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setBusyId(null)
    }
  }

  const invited = memberships.filter(m => m.status === "invited")
  const requested = memberships.filter(m => m.status === "requested")
  const active = memberships.filter(m => m.status === "active")

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {invited.length > 0 && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle>Convites pendentes</CardTitle>
            <CardDescription>Organizações parceiras que convidaram você.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {invited.map(m => (
              <div key={m.organization_id} className="flex items-center justify-between gap-4 p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="font-medium">{m.organizations!.name}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" type="button" onClick={() => accept(m)} disabled={busyId === m.organization_id}>
                    <Check className="h-4 w-4 mr-1" /> Aceitar
                  </Button>
                  <Button size="sm" type="button" variant="outline" onClick={() => leave(m)} disabled={busyId === m.organization_id}>
                    <X className="h-4 w-4 mr-1" /> Recusar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Minhas organizações</CardTitle>
          <CardDescription>
            Organizações parceiras da Menvo das quais você faz parte. Elas acompanham sua jornada e
            podem te conectar a mentores dedicados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {active.length === 0 && requested.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Você ainda não participa de nenhuma organização. Se recebeu um link de uma organização
              parceira, abra-o e clique em "Solicitar participação".
            </p>
          ) : null}

          {active.map(m => (
            <div key={m.organization_id} className="flex items-center justify-between gap-4 p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <Link href={`/o/${m.organizations!.slug}`} className="font-medium hover:underline">
                    {m.organizations!.name}
                  </Link>
                  {m.role === "admin" && (
                    <Badge variant="default" className="ml-2">Admin</Badge>
                  )}
                  <Badge variant="secondary" className="ml-2">
                    {isMentor ? "Mentor da organização" : "Beneficiário"}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                {m.role === "admin" && (
                  <Button size="sm" type="button" variant="outline" asChild>
                    <Link href="/dashboard/org">Painel da org</Link>
                  </Button>
                )}
                <Button size="sm" type="button" variant="ghost" onClick={() => leave(m)} disabled={busyId === m.organization_id}>
                  <LogOut className="h-4 w-4 mr-1" /> Sair
                </Button>
              </div>
            </div>
          ))}

          {requested.map(m => (
            <div key={m.organization_id} className="flex items-center justify-between gap-4 p-3 border rounded-lg border-dashed">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <span className="font-medium">{m.organizations!.name}</span>
                  <Badge variant="secondary" className="ml-2">Aguardando aprovação</Badge>
                </div>
              </div>
              <Button size="sm" type="button" variant="ghost" onClick={() => leave(m)} disabled={busyId === m.organization_id}>
                Cancelar solicitação
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
