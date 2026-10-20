import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { OrgDashboardMember } from "@/lib/domain/organizations/organization.entity"
import { MembersTable, type MembersTableVariant } from "./MembersTable"

interface MembersCardProps {
  /** Já com a contagem, ex.: "Beneficiários (3)". */
  title: string
  members: readonly OrgDashboardMember[]
  variant: MembersTableVariant
  /** Mostrado no lugar da tabela quando não há ninguém. */
  emptyMessage: ReactNode
  onRemove: (userId: string, label: string) => void
  busyUserId: string | null
}

/** Cartão de uma lista de membros: título, estado vazio ou a tabela. */
export function MembersCard({ title, members, variant, emptyMessage, onRemove, busyUserId }: MembersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-muted-foreground text-center py-10 text-sm">{emptyMessage}</p>
        ) : (
          <MembersTable members={members} variant={variant} onRemove={onRemove} busyUserId={busyUserId} />
        )}
      </CardContent>
    </Card>
  )
}
