import { Download, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { OrgPeriod } from "@/lib/domain/organizations/organization.entity"

const PERIOD_OPTIONS: readonly { id: OrgPeriod; label: string }[] = [
  { id: "all", label: "Tudo" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
  { id: "1y", label: "1 ano" },
]

interface ImpactToolbarProps {
  period: OrgPeriod
  onPeriodChange: (period: OrgPeriod) => void
  onExport: () => void
  /** Sem dados (ainda carregando ou org sem membros) não há o que exportar. */
  exportDisabled: boolean
}

/** Cabeçalho do Relatório de Impacto: título, filtro de período e botão de CSV. Sem estado próprio. */
export function ImpactToolbar({ period, onPeriodChange, onExport, exportDisabled }: ImpactToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-4 rounded-2xl border">
      <div>
        <h2 className="font-bold text-lg flex items-center gap-2 text-foreground">
          <Sparkles className="w-5 h-5 text-primary" />
          Relatório de Impacto
        </h2>
        <p className="text-xs text-muted-foreground">
          Métricas consolidadas de voluntariado e impacto social da organização.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl bg-background border p-1 text-xs">
          {PERIOD_OPTIONS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPeriodChange(p.id)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                period === p.id
                  ? "bg-primary text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={exportDisabled}
          className="rounded-xl flex items-center gap-1.5 text-xs font-semibold h-8"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar CSV</span>
        </Button>
      </div>
    </div>
  )
}
