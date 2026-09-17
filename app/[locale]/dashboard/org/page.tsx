"use client"

import { useCallback, useEffect, useState } from "react"
import { PageContainer } from "@/components/layout/PageContainer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Loader2, Building2, Check, X, UserPlus, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface OrgOption {
  id: string
  slug: string
  name: string
}

interface Member {
  userId: string
  role: "admin" | "member"
  status: "invited" | "requested" | "active"
  joinedAt: string
  fullName: string | null
  email: string | null
  sessionsBooked: number
  quizDone: boolean
}

export default function OrgAdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [orgOptions, setOrgOptions] = useState<OrgOption[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [organization, setOrganization] = useState<{ name: string; slug: string } | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)

  const loadOrg = useCallback(async (orgId: string) => {
    try {
      const response = await fetch(`/api/org/${orgId}`)
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || "Falha ao carregar organização")
      setOrganization(json.data.organization)
      setMembers(json.data.members)
    } catch (error: any) {
      toast.error(error.message)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/org/mine")
        const json = await response.json()
        if (!response.ok) throw new Error(json.error || "Falha ao carregar organizações")
        const options: OrgOption[] = json.data || []
        setOrgOptions(options)
        if (options.length > 0) {
          setSelectedOrgId(options[0].id)
          await loadOrg(options[0].id)
        }
      } catch (error: any) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [loadOrg])

  const invite = async () => {
    if (!selectedOrgId || !inviteEmail.trim()) return
    setInviting(true)
    try {
      const response = await fetch(`/api/org/${selectedOrgId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() })
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || "Falha ao convidar")
      toast.success(json.message)
      setInviteEmail("")
      await loadOrg(selectedOrgId)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setInviting(false)
    }
  }

  const approve = async (userId: string) => {
    if (!selectedOrgId) return
    setBusyUserId(userId)
    try {
      const response = await fetch(`/api/org/${selectedOrgId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || "Falha ao aprovar")
      toast.success(json.message)
      await loadOrg(selectedOrgId)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setBusyUserId(null)
    }
  }

  const remove = async (userId: string, label: string) => {
    if (!selectedOrgId) return
    setBusyUserId(userId)
    try {
      const response = await fetch(`/api/org/${selectedOrgId}/members?userId=${userId}`, {
        method: "DELETE"
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || "Falha ao remover")
      toast.success(label)
      await loadOrg(selectedOrgId)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setBusyUserId(null)
    }
  }

  if (loading) {
    return (
      <PageContainer className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </PageContainer>
    )
  }

  if (!selectedOrgId || orgOptions.length === 0) {
    return (
      <PageContainer>
        <p className="text-muted-foreground text-center py-20">
          Você não administra nenhuma organização parceira.
        </p>
      </PageContainer>
    )
  }

  const pending = members.filter(m => m.status === "requested")
  const invited = members.filter(m => m.status === "invited")
  const active = members.filter(m => m.status === "active")

  return (
    <PageContainer>
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">{organization?.name ?? "Minha Organização"}</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Link público para compartilhar: <code>/o/{organization?.slug}</code>
      </p>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Convidar membro
            </CardTitle>
            <CardDescription>
              A pessoa precisa já ter conta na Menvo. Ela recebe um e-mail e aceita no perfil dela.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2 items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite-email">E-mail</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="pessoa@exemplo.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && invite()}
              />
            </div>
            <Button onClick={invite} disabled={inviting || !inviteEmail.trim()}>
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Convidar"}
            </Button>
          </CardContent>
        </Card>

        <Card className={pending.length > 0 ? "border-primary/40" : undefined}>
          <CardHeader>
            <CardTitle>Solicitações pendentes ({pending.length})</CardTitle>
            <CardDescription>Pessoas que pediram para entrar pelo link público.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma solicitação no momento.</p>
            ) : (
              pending.map(m => (
                <div key={m.userId} className="flex items-center justify-between gap-3 p-2 border rounded-lg">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.fullName ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" onClick={() => approve(m.userId)} disabled={busyUserId === m.userId}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => remove(m.userId, "Solicitação recusada")} disabled={busyUserId === m.userId}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros ({active.length})</CardTitle>
          {invited.length > 0 && (
            <CardDescription>{invited.length} convite(s) aguardando aceite.</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {active.length === 0 && invited.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">
              Ainda não há membros. Convide por e-mail ou compartilhe <code>/o/{organization?.slug}</code>.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Quiz feito</TableHead>
                  <TableHead>Sessões</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...active, ...invited].map(m => (
                  <TableRow key={m.userId} className={m.status === "invited" ? "opacity-60" : undefined}>
                    <TableCell className="font-medium">{m.fullName ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.email ?? "—"}</TableCell>
                    <TableCell>
                      {m.status === "invited" ? (
                        <Badge variant="outline">Convidado</Badge>
                      ) : (
                        <Badge variant={m.role === "admin" ? "default" : "secondary"}>
                          {m.role === "admin" ? "Admin" : "Membro"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{m.quizDone ? "Sim" : "Não"}</TableCell>
                    <TableCell>{m.sessionsBooked}</TableCell>
                    <TableCell className="text-right">
                      {m.role !== "admin" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => remove(m.userId, m.status === "invited" ? "Convite cancelado" : "Membro removido")}
                          disabled={busyUserId === m.userId}
                          aria-label="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}
