"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { MenvoDots } from "@/components/ui/menvo-loader"
import { useAuth } from "@/lib/auth"
import { useJoinOrganization } from "@/hooks/organizations/useJoinOrganization"
import { useLeaveOrganization } from "@/hooks/organizations/useLeaveOrganization"
import { useMyMemberships, type MembershipWithOrg } from "@/hooks/organizations/useMyMemberships"
import { MyOrganizationsCard } from "@/components/organizations/MyOrganizationsCard"
import { PendingInvitesCard } from "@/components/organizations/PendingInvitesCard"

const LEAVE_MESSAGES: Record<MembershipWithOrg["status"], string> = {
  invited: "Convite recusado",
  requested: "Solicitação cancelada",
  active: "Você saiu da organização",
}

/**
 * Aba "Organizações" do perfil: convites, participações e pedidos da própria
 * pessoa. Os dados vêm de `useMyMemberships` (o mesmo cache do botão da página
 * pública da org); aceitar, recusar e sair são mutations que invalidam esse cache.
 */
export function OrganizationsTab() {
  const { user, cachedRoles } = useAuth()
  const isMentor = cachedRoles?.mentor === true
  const memberships = useMyMemberships(user?.id)
  const join = useJoinOrganization(user?.id)
  const leave = useLeaveOrganization(user?.id)
  const [busyId, setBusyId] = useState<string | null>(null)

  /** Roda uma ação sobre um vínculo marcando a linha como ocupada e avisando o resultado. */
  const act = async (m: MembershipWithOrg, run: () => Promise<string>, fallback: string) => {
    setBusyId(m.organization_id)
    try {
      toast.success(await run())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : fallback)
    } finally {
      setBusyId(null)
    }
  }

  const accept = (m: MembershipWithOrg) =>
    act(m, async () => (await join.mutateAsync(m.organizations.slug)).message ?? "", "Não foi possível aceitar o convite")
  const leaveOrg = (m: MembershipWithOrg) =>
    act(m, async () => {
      await leave.mutateAsync(m.organization_id)
      return LEAVE_MESSAGES[m.status]
    }, "Não foi possível sair")

  const loadError = memberships.error
  useEffect(() => {
    if (loadError) toast.error(loadError.message || "Falha ao carregar organizações")
  }, [loadError])

  if (memberships.isPending && user) {
    return (
      <div className="flex justify-center py-10">
        <MenvoDots />
      </div>
    )
  }

  const all = memberships.data ?? []
  return (
    <div className="space-y-6">
      <PendingInvitesCard
        invites={all.filter(m => m.status === "invited")}
        busyId={busyId}
        onAccept={accept}
        onDecline={leaveOrg}
      />
      <MyOrganizationsCard
        active={all.filter(m => m.status === "active")}
        requested={all.filter(m => m.status === "requested")}
        isMentor={isMentor}
        busyId={busyId}
        onLeave={leaveOrg}
      />
    </div>
  )
}
