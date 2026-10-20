import type { ReactNode } from "react"
import { CalendarCheck, GraduationCap, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { OrgDashboardSummary } from "@/lib/domain/organizations/organization.entity"

function SummaryCard({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <Card>
      <CardContent className="pt-6 flex items-center gap-3">
        {icon}
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/** Cartões do topo: beneficiários, mentores da org e sessões (agendadas + dadas). */
export function SummaryCards({ summary }: { summary: OrgDashboardSummary }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      <SummaryCard
        icon={<Users className="h-8 w-8 text-primary shrink-0" />}
        value={summary.beneficiaries}
        label="Beneficiários"
      />
      <SummaryCard
        icon={<GraduationCap className="h-8 w-8 text-primary shrink-0" />}
        value={summary.mentors}
        label="Mentores da org"
      />
      <SummaryCard
        icon={<CalendarCheck className="h-8 w-8 text-primary shrink-0" />}
        value={summary.sessionsBookedByBeneficiaries + summary.sessionsGivenByOrgMentors}
        label="Sessões (agendadas + dadas)"
      />
    </div>
  )
}
