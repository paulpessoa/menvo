import { Building2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { MembershipWithOrg } from "@/hooks/organizations/useMyMemberships"

interface PendingInvitesCardProps {
  invites: readonly MembershipWithOrg[]
  /** Id da organização com uma ação em andamento (desabilita só aquela linha). */
  busyId: string | null
  onAccept: (membership: MembershipWithOrg) => void
  onDecline: (membership: MembershipWithOrg) => void
}

/** Convites que organizações parceiras fizeram à pessoa: aceitar ou recusar. */
export function PendingInvitesCard({ invites, busyId, onAccept, onDecline }: PendingInvitesCardProps) {
  if (invites.length === 0) return null

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle>Convites pendentes</CardTitle>
        <CardDescription>Organizações parceiras que convidaram você.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {invites.map(m => (
          <div key={m.organization_id} className="flex items-center justify-between gap-4 p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-medium">{m.organizations.name}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" type="button" onClick={() => onAccept(m)} disabled={busyId === m.organization_id}>
                <Check className="h-4 w-4 mr-1" /> Aceitar
              </Button>
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => onDecline(m)}
                disabled={busyId === m.organization_id}
              >
                <X className="h-4 w-4 mr-1" /> Recusar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
