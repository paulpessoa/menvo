"use client"

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { AdminOverview } from "@/lib/services/admin/overview.types"
import { AXIS_PROPS, GRID_STROKE, SERIES, TOOLTIP_STYLE, formatShortDate, formatUsd } from "./chart-theme"

interface AiSpendChartProps {
  ai: AdminOverview["ai"]
}

/**
 * Month-to-date AI spend against the monthly ceiling. Both are dollars on one
 * axis, so the gap between the area and the dashed line is the remaining
 * budget at a glance.
 */
export function AiSpendChart({ ai }: AiSpendChartProps) {
  const yMax = Math.max(ai.spentUsd, ai.budgetUsd ?? 0) * 1.1 || 1

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        <span className="text-2xl font-semibold tabular-nums text-foreground">{formatUsd(ai.spentUsd)}</span>
        {ai.budgetUsd !== null ? ` de ${formatUsd(ai.budgetUsd)} no mês` : " no mês · sem teto definido"}
      </p>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={ai.cumulativeByDay} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="day" tickFormatter={formatShortDate} {...AXIS_PROPS} minTickGap={16} />
            <YAxis domain={[0, yMax]} tickFormatter={v => `$${Number(v).toFixed(0)}`} {...AXIS_PROPS} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={label => formatShortDate(String(label))}
              formatter={value => [formatUsd(Number(value)), "Acumulado"]}
            />
            {ai.budgetUsd !== null && (
              <ReferenceLine
                y={ai.budgetUsd}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                label={{ value: "Teto", position: "insideTopRight", fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
            )}
            <Area
              type="monotone"
              dataKey="costUsd"
              stroke={SERIES.primary}
              strokeWidth={2}
              fill={SERIES.primary}
              fillOpacity={0.12}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
