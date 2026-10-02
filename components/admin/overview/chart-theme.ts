/**
 * Chart colors for the admin overview. Slot order is fixed (never cycled) and
 * was checked with the dataviz palette validator: teal, violet and orange pass
 * CVD and normal-vision separation for every pair. Teal is the brand #007585
 * nudged to #0089a0 so it doesn't read as gray next to the others. Gray is
 * reserved for de-emphasized series (cancelled, no role) and always ships
 * with a labeled legend.
 */
export const SERIES = {
  primary: "#0089a0",
  secondary: "#4a3aa7",
  tertiary: "#eb6834",
  muted: "#a3a29c"
} as const

/** Recessive axes: muted ink, no axis lines or ticks. */
export const AXIS_PROPS = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 12,
  tickLine: false,
  axisLine: false
} as const

export const GRID_STROKE = "hsl(var(--border))"

export const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))",
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
} as const

const intFormatter = new Intl.NumberFormat("pt-BR")

export const formatInt = (value: number) => intFormatter.format(value)

export const formatUsd = (value: number) => `US$ ${value.toFixed(value > 0 && value < 1 ? 4 : 2)}`

export const formatPercent = (value: number) => `${Math.round(value * 100)}%`

/** "2026-09-28" -> "28/09"; weeks and days are labeled by their first day. */
export const formatShortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

/** Relative change vs a previous period, or null when there is no base to compare to. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return (current - previous) / previous
}
