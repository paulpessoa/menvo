import { SERIES, formatInt } from "./chart-theme"

export interface BarListItem {
  label: string
  value: number
  /** Overrides the formatted value shown at the end of the row (e.g. currency). */
  display?: string
  /** De-emphasizes a row (e.g. rejected, closed) without giving it a new hue. */
  muted?: boolean
}

interface BarListProps {
  items: BarListItem[]
  emptyMessage?: string
}

/**
 * Horizontal magnitude bars in plain HTML: one hue, value always printed, so
 * nothing depends on hover or color alone. Used for small categorical counts
 * where a full chart library would add weight without adding information.
 */
export function BarList({ items, emptyMessage = "Sem dados no período." }: BarListProps) {
  const max = Math.max(0, ...items.map(i => i.value))
  if (max === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>

  return (
    <ul className="space-y-3">
      {items.map(item => (
        <li key={item.label} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-muted-foreground">{item.label}</span>
            <span className="font-medium tabular-nums text-foreground">{item.display ?? formatInt(item.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${Math.max((item.value / max) * 100, item.value > 0 ? 2 : 0)}%`,
                background: item.muted ? SERIES.muted : SERIES.primary
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
