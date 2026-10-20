import type { ReactNode } from "react"
import { CalendarCheck, Clock, Sparkles, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { OrgDashboardImpact } from "@/lib/domain/organizations/organization.entity"

interface StatCardProps {
  icon: ReactNode
  value: ReactNode
  label: string
  /** Cor do quadrado do ícone; o padrão é a cor primária. */
  iconTone?: string
}

function StatCard({ icon, value, label, iconTone = "bg-primary/10 text-primary" }: StatCardProps) {
  return (
    <Card className="rounded-2xl border">
      <CardContent className="pt-6 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconTone}`}>{icon}</div>
        <div>
          <p className="text-2xl font-black text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/** Os quatro números do relatório de impacto (horas, sessões, diagnósticos, nota média). */
export function ImpactCards({ impact }: { impact: OrgDashboardImpact }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={<Clock className="h-5 w-5" />} value={`${impact.totalHoursCompleted}h`} label="Horas de mentoria" />
      <StatCard
        icon={<CalendarCheck className="h-5 w-5" />}
        value={impact.totalSessionsCompleted}
        label="Sessões concluídas"
      />
      <StatCard
        icon={<Sparkles className="h-5 w-5" />}
        value={impact.totalDiagnosticsDone}
        label="Diagnósticos feitos"
      />
      <StatCard
        icon={<Star className="h-5 w-5 fill-current" />}
        iconTone="bg-amber-500/10 text-amber-600"
        value={impact.averageRating ? `${impact.averageRating.toFixed(1)} ★` : "—"}
        label="Avaliação média"
      />
    </div>
  )
}
