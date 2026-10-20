import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { OrgDashboardMember } from "@/lib/domain/organizations/organization.entity"

interface PendingRequestsCardProps {
  requests: readonly OrgDashboardMember[]
  /** Id de quem está com uma ação em andamento (desabilita só aquela linha). */
  busyUserId: string | null
  onApprove: (userId: string) => void
  onReject: (userId: string) => void
}

/** Pedidos para entrar feitos pelo link público: aprovar ou recusar. */
export function PendingRequestsCard({ requests, busyUserId, onApprove, onReject }: PendingRequestsCardProps) {
  return (
    <Card className={requests.length > 0 ? "border-primary/40" : undefined}>
      <CardHeader>
        <CardTitle>Solicitações pendentes ({requests.length})</CardTitle>
        <CardDescription>Pessoas que pediram para entrar pelo link público.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma solicitação no momento.</p>
        ) : (
          requests.map(m => (
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
                <Button size="sm" aria-label="Aprovar" onClick={() => onApprove(m.userId)} disabled={busyUserId === m.userId}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Recusar"
                  onClick={() => onReject(m.userId)}
                  disabled={busyUserId === m.userId}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
