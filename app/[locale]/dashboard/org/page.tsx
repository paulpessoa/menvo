"use client"

import { useCallback, useEffect, useState } from "react"
import { PageContainer } from "@/components/layout/PageContainer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Loader2, Building2, Check, X, UserPlus, Trash2, Users, GraduationCap, CalendarCheck } from "lucide-react"
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
  platformRole: "mentor" | "mentee" | null
  joinedAt: string
  fullName: string | null
  email: string | null
  sessionsBooked: number
  sessionsGiven: number
  quizDone: boolean
}

interface Summary {
  beneficiaries: number
  mentors: number
  pendingRequests: number
  pendingInvites: number
  sessionsBookedByBeneficiaries: number
  sessionsGivenByOrgMentors: number
}

function MemberRow({
  m,
  showSessions,
  onRemove,
  busy
}: {
  m: Member
  showSessions: "booked" | "given"
  onRemove: (userId: string, label: string) => void
  busy: boolean
}) {
  return (
    <TableRow className={m.status === "invited" ? "opacity-60" : undefined}>
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
      {showSessions === "booked" ? (
        <>
          <TableCell>{m.quizDone ? "Sim" : "Não"}</TableCell>
          <TableCell>{m.sessionsBooked}</TableCell>
        </>
      ) : (
        <TableCell>{m.sessionsGiven}</TableCell>
      )}
      <TableCell className="text-right">
        {m.role !== "admin" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(m.userId, m.status === "invited" ? "Convite cancelado" : "Membro removido")}
            disabled={busy}
            aria-label="Remover"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}

export default function OrgAdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [orgOptions, setOrgOptions] = useState<OrgOption[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [organization, setOrganization] = useState<{ name: string; slug: string; join_policy?: "open" | "invite_only" } | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [updatingPolicy, setUpdatingPolicy] = useState(false)

  const loadOrg = useCallback(async (orgId: string) => {
    try {
      const response = await fetch(`/api/org/${orgId}`)
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || "Falha ao carregar organização")
      setOrganization(json.data.organization)
      setMembers(json.data.members)
      setSummary(json.data.summary)
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

  const togglePolicy = async (open: boolean) => {
    if (!selectedOrgId) return
    setUpdatingPolicy(true)
    try {
      const response = await fetch(`/api/org/${selectedOrgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ join_policy: open ? "open" : "invite_only" })
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || "Falha ao atualizar")
      toast.success(open ? "Página pública: qualquer pessoa logada pode solicitar" : "Página pública: somente por convite")
      await loadOrg(selectedOrgId)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setUpdatingPolicy(false)
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
  const beneficiaries = members.filter(m => m.platformRole !== "mentor" && (m.status === "active" || m.status === "invited"))
  const orgMentors = members.filter(m => m.platformRole === "mentor" && (m.status === "active" || m.status === "invited"))
  const isOpen = (organization?.join_policy ?? "open") === "open"

  return (
    <PageContainer>
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">{organization?.name ?? "Minha Organização"}</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Link público para compartilhar: <code>/o/{organization?.slug}</code>
      </p>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Users className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{summary.beneficiaries}</p>
                <p className="text-xs text-muted-foreground">Beneficiários</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{summary.mentors}</p>
                <p className="text-xs text-muted-foreground">Mentores da org</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <CalendarCheck className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{summary.sessionsBookedByBeneficiaries + summary.sessionsGivenByOrgMentors}</p>
                <p className="text-xs text-muted-foreground">Sessões (agendadas + dadas)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                    <p className="font-medium truncate">
                      {m.fullName ?? "—"}
                      {m.platformRole && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({m.platformRole === "mentor" ? "mentor" : "mentorado"})
                        </span>
                      )}
                    </p>
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Página pública</CardTitle>
          <CardDescription>
            {isOpen
              ? "Aberta: qualquer pessoa logada pode solicitar participação em /o/" + organization?.slug + "."
              : "Somente por convite: a página existe, mas ninguém pode solicitar participação sozinho — só quem você convidar entra."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Switch checked={isOpen} onCheckedChange={togglePolicy} disabled={updatingPolicy} />
          <span className="text-sm">{isOpen ? "Aberta" : "Somente por convite"}</span>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Beneficiários ({beneficiaries.filter(m => m.status === "active").length})</CardTitle>
          </CardHeader>
          <CardContent>
            {beneficiaries.length === 0 ? (
              <p className="text-muted-foreground text-center py-10 text-sm">
                Ainda não há beneficiários. Convide por e-mail ou compartilhe <code>/o/{organization?.slug}</code>.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Sessões</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {beneficiaries.map(m => (
                    <MemberRow key={m.userId} m={m} showSessions="booked" onRemove={remove} busy={busyUserId === m.userId} />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mentores da organização ({orgMentors.filter(m => m.status === "active").length})</CardTitle>
          </CardHeader>
          <CardContent>
            {orgMentors.length === 0 ? (
              <p className="text-muted-foreground text-center py-10 text-sm">
                Nenhum mentor vinculado ainda. Convide um mentor que já tem conta na Menvo.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Sessões dadas</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgMentors.map(m => (
                    <MemberRow key={m.userId} m={m} showSessions="given" onRemove={remove} busy={busyUserId === m.userId} />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
