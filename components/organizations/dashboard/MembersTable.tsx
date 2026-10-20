import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2 } from "lucide-react"
import type { OrgDashboardMember } from "@/lib/domain/organizations/organization.entity"

/** `booked`: tabela de beneficiários (quiz + sessões agendadas). `given`: de mentores (sessões dadas). */
export type MembersTableVariant = "booked" | "given"

interface MemberRowProps {
  member: OrgDashboardMember
  variant: MembersTableVariant
  onRemove: (userId: string, label: string) => void
  busy: boolean
}

function MemberRow({ member: m, variant, onRemove, busy }: MemberRowProps) {
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
      {variant === "booked" ? (
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

interface MembersTableProps {
  members: readonly OrgDashboardMember[]
  variant: MembersTableVariant
  onRemove: (userId: string, label: string) => void
  /** Id de quem está com uma ação em andamento (desabilita só aquela linha). */
  busyUserId: string | null
}

/**
 * Tabela de membros do dashboard da org. Uma só para beneficiários e mentores:
 * muda apenas o par de colunas de números. Recebe a Entity por props e não
 * sabe de rede; remover é um callback do pai.
 */
export function MembersTable({ members, variant, onRemove, busyUserId }: MembersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>E-mail</TableHead>
          <TableHead>Papel</TableHead>
          {variant === "booked" ? (
            <>
              <TableHead>Quiz</TableHead>
              <TableHead>Sessões</TableHead>
            </>
          ) : (
            <TableHead>Sessões dadas</TableHead>
          )}
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map(m => (
          <MemberRow key={m.userId} member={m} variant={variant} onRemove={onRemove} busy={busyUserId === m.userId} />
        ))}
      </TableBody>
    </Table>
  )
}
