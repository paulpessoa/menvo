"use client"

import { useEffect, useState } from "react"
import { Building2 } from "lucide-react"
import { toast } from "sonner"
import { MenvoDots } from "@/components/ui/menvo-loader"
import { PageContainer } from "@/components/layout/PageContainer"
import type { OrgPeriod } from "@/lib/domain/organizations/organization.entity"
import { useMyAdminOrganizations, useOrgDashboard } from "@/hooks/organizations/useOrgDashboard"
import { useOrgMemberActions } from "@/hooks/organizations/useOrgMemberActions"
import { InviteMemberCard } from "./InviteMemberCard"
import { ImpactSection } from "./ImpactSection"
import { JoinPolicyCard } from "./JoinPolicyCard"
import { MembersCard } from "./MembersCard"
import { PendingRequestsCard } from "./PendingRequestsCard"
import { SummaryCards } from "./SummaryCards"

const messageOf = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

/**
 * Painel do admin da organização. Orquestra os hooks (quem administro, o
 * dashboard do período, as ações) e entrega a cada cartão só o que ele mostra.
 * Dados e cache são do TanStack Query: depois de cada ação o dashboard é
 * rebuscado pelo mapa de efeitos, sem recarregar tudo à mão.
 */
export function OrgDashboard() {
  const mine = useMyAdminOrganizations()
  const orgId = mine.data?.[0]?.id
  const [period, setPeriod] = useState<OrgPeriod>("all")
  const dashboard = useOrgDashboard(orgId, period)
  const actions = useOrgMemberActions(orgId)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)

  const loadError = mine.error ?? dashboard.error
  useEffect(() => {
    if (loadError) toast.error(messageOf(loadError, "Falha ao carregar organização"))
  }, [loadError])

  /** Roda uma ação marcando (ou não) a linha como ocupada; devolve se deu certo. */
  const run = async (userId: string | null, action: () => Promise<string | undefined>, fallback: string) => {
    setBusyUserId(userId)
    try {
      const message = await action()
      if (message) toast.success(message)
      return true
    } catch (error) {
      toast.error(messageOf(error, fallback))
      return false
    } finally {
      setBusyUserId(null)
    }
  }

  const invite = (email: string) => run(null, async () => (await actions.invite.mutateAsync(email)).message, "Falha ao convidar")
  const approve = (userId: string) => run(userId, async () => (await actions.approve.mutateAsync(userId)).message, "Falha ao aprovar")
  const remove = (userId: string, label: string) =>
    run(userId, async () => {
      await actions.remove.mutateAsync(userId)
      return label
    }, "Falha ao remover")
  const togglePolicy = (open: boolean) =>
    run(null, async () => {
      await actions.updateJoinPolicy.mutateAsync(open ? "open" : "invite_only")
      return open ? "Página pública: qualquer pessoa logada pode solicitar" : "Página pública: somente por convite"
    }, "Falha ao atualizar")

  if (mine.isPending || (orgId && dashboard.isPending)) {
    return (
      <PageContainer className="flex justify-center py-20">
        <MenvoDots />
      </PageContainer>
    )
  }

  if (!orgId) {
    return (
      <PageContainer>
        <p className="text-muted-foreground text-center py-20">Você não administra nenhuma organização parceira.</p>
      </PageContainer>
    )
  }

  const organization = dashboard.data?.organization
  const members = dashboard.data?.members ?? []
  const summary = dashboard.data?.summary
  const slug = organization?.slug ?? mine.data?.[0]?.slug ?? ""
  const pending = members.filter(m => m.status === "requested")
  const listed = members.filter(m => m.status === "active" || m.status === "invited")
  const beneficiaries = listed.filter(m => m.platformRole !== "mentor")
  const orgMentors = listed.filter(m => m.platformRole === "mentor")
  const activeCount = (list: typeof members) => list.filter(m => m.status === "active").length

  return (
    <PageContainer>
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">{organization?.name ?? "Minha Organização"}</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Link público para compartilhar: <code>/o/{slug}</code>
      </p>

      <ImpactSection
        organization={{ name: organization?.name ?? "", slug }}
        period={period}
        onPeriodChange={setPeriod}
        summary={summary}
        members={members}
      />
      {summary && <SummaryCards summary={summary} />}

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <InviteMemberCard onInvite={invite} pending={actions.invite.isPending} />
        <PendingRequestsCard
          requests={pending}
          busyUserId={busyUserId}
          onApprove={approve}
          onReject={userId => remove(userId, "Solicitação recusada")}
        />
      </div>

      <JoinPolicyCard
        slug={slug}
        isOpen={(organization?.join_policy ?? "open") === "open"}
        pending={actions.updateJoinPolicy.isPending}
        onToggle={togglePolicy}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <MembersCard
          title={`Beneficiários (${activeCount(beneficiaries)})`}
          members={beneficiaries}
          variant="booked"
          onRemove={remove}
          busyUserId={busyUserId}
          emptyMessage={
            <>
              Ainda não há beneficiários. Convide por e-mail ou compartilhe <code>/o/{slug}</code>.
            </>
          }
        />
        <MembersCard
          title={`Mentores da organização (${activeCount(orgMentors)})`}
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
