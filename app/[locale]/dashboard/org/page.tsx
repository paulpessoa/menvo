"use client"

import { MenvoDots } from "@/components/ui/menvo-loader"
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
import { Building2, Check, X, UserPlus, Trash2, Users, GraduationCap, CalendarCheck, Loader2, Download, Clock, Sparkles, Star } from "lucide-react"
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
  impact?: {
    period: "all" | "30d" | "90d" | "1y"
    totalSessionsCompleted: number
    totalHoursCompleted: number
    totalDiagnosticsDone: number
    averageRating: number | null
  }
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
      <TableCell className="font-medium">{m.fullName ?? "-"}</TableCell>
      <TableCell className="text-muted-foreground">{m.email ?? "-"}</TableCell>
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
  const [selectedPeriod, setSelectedPeriod] = useState<"all" | "30d" | "90d" | "1y">("all")
  const [organization, setOrganization] = useState<{ name: string; slug: string; join_policy?: "open" | "invite_only" } | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [updatingPolicy, setUpdatingPolicy] = useState(false)

  const loadOrg = useCallback(async (orgId: string, period: "all" | "30d" | "90d" | "1y" = "all") => {
    try {
      const response = await fetch(`/api/org/${orgId}?period=${period}`)
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || "Falha ao carregar organização")
      setOrganization(json.data.organization)
      setMembers(json.data.members)
      setSummary(json.data.summary)
    } catch (error: any) {
      toast.error(error.message)
    }
  }, [])

  const handlePeriodChange = async (period: "all" | "30d" | "90d" | "1y") => {
    setSelectedPeriod(period)
    if (selectedOrgId) {
      await loadOrg(selectedOrgId, period)
    }
  }

  const exportCsv = () => {
    if (!organization || !summary) return
    const periodLabels: Record<string, string> = {
      all: "Todo o período",
      "30d": "Últimos 30 dias",
      "90d": "Últimos 90 dias",
      "1y": "Último ano",
    }
    const periodText = periodLabels[selectedPeriod] || selectedPeriod

    const lines: string[] = [
      `Relatório de Impacto - Organização: "${organization.name}"`,
      `Período: "${periodText}"`,
      `Data de Emissão: "${new Date().toLocaleDateString("pt-BR")}"`,
      `Sessões Concluídas: "${summary.impact?.totalSessionsCompleted ?? 0}"`,
      `Horas de Mentoria: "${summary.impact?.totalHoursCompleted ?? 0}h"`,
      `Diagnósticos Realizados: "${summary.impact?.totalDiagnosticsDone ?? 0}"`,
      `Nota Média: "${summary.impact?.averageRating ? summary.impact.averageRating.toFixed(1) : "N/A"}"`,
      "",
      "Nome,E-mail,Papel na Organização,Perfil Plataforma,Status,Sessões Solicitadas,Sessões Ministradas,Diagnóstico Concluído,Data de Entrada",
    ]

    for (const m of members) {
      const escape = (val: string | null | undefined) => `"${(val || "").replace(/"/g, '""')}"`
      const roleLabel = m.role === "admin" ? "Admin" : "Membro"
      const platformRoleLabel = m.platformRole === "mentor" ? "Mentor" : "Beneficiário"
      const statusLabel = m.status === "invited" ? "Convidado" : m.status === "requested" ? "Solicitado" : "Ativo"
      const quizLabel = m.quizDone ? "Sim" : "Não"
      const dateLabel = m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("pt-BR") : ""

      lines.push([
        escape(m.fullName),
        escape(m.email),
        escape(roleLabel),
        escape(platformRoleLabel),
        escape(statusLabel),
        m.sessionsBooked,
        m.sessionsGiven,
        escape(quizLabel),
        escape(dateLabel),
      ].join(","))
    }

    const csvContent = "\uFEFF" + lines.join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `relatorio-impacto-${organization.slug}-${selectedPeriod}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success("Relatório CSV exportado com sucesso!")
  }

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
        <MenvoDots />
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

      {/* Relatório de Impacto (C-O3) */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-4 rounded-2xl border">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2 text-foreground">
              <Sparkles className="w-5 h-5 text-primary" />
              Relatório de Impacto
            </h2>
            <p className="text-xs text-muted-foreground">
              Métricas consolidadas de voluntariado e impacto social da organização.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl bg-background border p-1 text-xs">
              {(
                [
                  { id: "all", label: "Tudo" },
                  { id: "30d", label: "30 dias" },
                  { id: "90d", label: "90 dias" },
                  { id: "1y", label: "1 ano" },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePeriodChange(p.id)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    selectedPeriod === p.id
                      ? "bg-primary text-white shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={!summary || members.length === 0}
              className="rounded-xl flex items-center gap-1.5 text-xs font-semibold h-8"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </Button>
          </div>
        </div>

        {summary?.impact && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border">
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{summary.impact.totalHoursCompleted}h</p>
                  <p className="text-xs text-muted-foreground">Horas de mentoria</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border">
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{summary.impact.totalSessionsCompleted}</p>
                  <p className="text-xs text-muted-foreground">Sessões concluídas</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border">
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{summary.impact.totalDiagnosticsDone}</p>
                  <p className="text-xs text-muted-foreground">Diagnósticos feitos</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border">
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">
                    {summary.impact.averageRating ? `${summary.impact.averageRating.toFixed(1)} ★` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Avaliação média</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

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
              {inviting ? <Loader2 className="animate-spin h-4 w-4" /> : "Convidar"}
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
                      {m.fullName ?? "-"}
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
              : "Somente por convite: a página existe, mas ninguém pode solicitar participação sozinho - só quem você convidar entra."}
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
