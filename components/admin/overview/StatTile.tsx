import { Card, CardContent } from "@/components/ui/card"
import { formatPercent } from "./chart-theme"

interface StatTileProps {
  label: string
  value: string
  /** Context line under the value (period, ratio, ceiling). */
  detail?: string
  /** Relative change vs the previous period; null hides the delta. */
  change?: number | null
}

/** Headline number with optional period-over-period delta. Deltas carry a sign, never color alone. */
export function StatTile({ label, value, detail, change }: StatTileProps) {
  return (
    <Card>
      <CardContent className="space-y-1 p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">
          {change !== undefined && change !== null && (
            <span className={change >= 0 ? "font-medium text-emerald-700" : "font-medium text-rose-700"}>
              {change >= 0 ? "+" : "−"}
              {formatPercent(Math.abs(change))} vs 30 dias anteriores
            </span>
          )}
          {change !== undefined && change !== null && detail && " · "}
          {detail}
        </p>
      </CardContent>
    </Card>
  )
}
