import { Building2, LogOut } from "lucide-react"
import { Link } from "@/i18n/routing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { MembershipWithOrg } from "@/hooks/organizations/useMyMemberships"

interface MyOrganizationsCardProps {
  active: readonly MembershipWithOrg[]
  requested: readonly MembershipWithOrg[]
  /** O selo da participação depende do papel da pessoa na plataforma, não do vínculo. */
  isMentor: boolean
  busyId: string | null
  onLeave: (membership: MembershipWithOrg) => void
}

/** Participações ativas e pedidos aguardando aprovação da própria pessoa. */
export function MyOrganizationsCard({ active, requested, isMentor, busyId, onLeave }: MyOrganizationsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Minhas organizações</CardTitle>
        <CardDescription>
          Organizações parceiras da Menvo das quais você faz parte. Elas acompanham sua jornada e
          podem te conectar a mentores dedicados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {active.length === 0 && requested.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Você ainda não participa de nenhuma organização. Se recebeu um link de uma organização
            parceira, abra-o e clique em "Solicitar participação".
          </p>
        ) : null}

        {active.map(m => (
          <div key={m.organization_id} className="flex items-center justify-between gap-4 p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <Link href={`/o/${m.organizations.slug}`} className="font-medium hover:underline">
                  {m.organizations.name}
                </Link>
                {m.role === "admin" && <Badge variant="default" className="ml-2">Admin</Badge>}
                <Badge variant="secondary" className="ml-2">
                  {isMentor ? "Mentor da organização" : "Beneficiário"}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {m.role === "admin" && (
                <Button size="sm" type="button" variant="outline" asChild>
                  <Link href="/dashboard/org">Painel da org</Link>
                </Button>
              )}
              <Button size="sm" type="button" variant="ghost" onClick={() => onLeave(m)} disabled={busyId === m.organization_id}>
                <LogOut className="h-4 w-4 mr-1" /> Sair
              </Button>
            </div>
          </div>
        ))}

        {requested.map(m => (
          <div key={m.organization_id} className="flex items-center justify-between gap-4 p-3 border rounded-lg border-dashed">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <span className="font-medium">{m.organizations.name}</span>
                <Badge variant="secondary" className="ml-2">Aguardando aprovação</Badge>
              </div>
            </div>
            <Button size="sm" type="button" variant="ghost" onClick={() => onLeave(m)} disabled={busyId === m.organization_id}>
              Cancelar solicitação
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
