"use client"

import { MenvoDots } from "@/components/ui/menvo-loader"
import { useCallback, useEffect, useState } from "react"
import { PageContainer } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Check, X, UserPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { OrgDashboardMember, OrgDashboardSummary } from "@/lib/domain/organizations/organization.entity"
import { buildOrgImpactCsv, orgImpactCsvFilename } from "@/lib/domain/organizations/org-report.csv"
import { ImpactCards } from "@/components/organizations/dashboard/ImpactCards"
import { ImpactToolbar } from "@/components/organizations/dashboard/ImpactToolbar"
import { MembersCard } from "@/components/organizations/dashboard/MembersCard"
import { SummaryCards } from "@/components/organizations/dashboard/SummaryCards"
import { downloadCsv } from "@/components/organizations/dashboard/downloadCsv"

interface OrgOption {
  id: string
  slug: string
  name: string
}

type Member = OrgDashboardMember
type Summary = OrgDashboardSummary

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
    const csv = buildOrgImpactCsv({
      orgName: organization.name,
      period: selectedPeriod,
      summary,
      members,
      issuedAt: new Date(),
    })
    downloadCsv(orgImpactCsvFilename(organization.slug, selectedPeriod), csv)
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
        <ImpactToolbar
          period={selectedPeriod}
          onPeriodChange={handlePeriodChange}
          onExport={exportCsv}
          exportDisabled={!summary || members.length === 0}
        />
        {summary?.impact && <ImpactCards impact={summary.impact} />}
      </div>

      {summary && <SummaryCards summary={summary} />}

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
        <MembersCard
          title={`Beneficiários (${beneficiaries.filter(m => m.status === "active").length})`}
          members={beneficiaries}
          variant="booked"
          onRemove={remove}
          busyUserId={busyUserId}
          emptyMessage={
            <>
              Ainda não há beneficiários. Convide por e-mail ou compartilhe <code>/o/{organization?.slug}</code>.
            </>
          }
        />
        <MembersCard
          title={`Mentores da organização (${orgMentors.filter(m => m.status === "active").length})`}
          members={orgMentors}
          variant="given"
          onRemove={remove}
          busyUserId={busyUserId}
          emptyMessage="Nenhum mentor vinculado ainda. Convide um mentor que já tem conta na Menvo."
        />
      </div>
    </PageContainer>
  )
}
