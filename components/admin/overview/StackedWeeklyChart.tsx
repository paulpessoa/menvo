"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { AXIS_PROPS, GRID_STROKE, TOOLTIP_STYLE, formatInt, formatShortDate } from "./chart-theme"

export interface StackSeries<K extends string> {
  key: K
  label: string
  color: string
}

interface StackedWeeklyChartProps<K extends string> {
  data: ({ week: string } & Record<K, number>)[]
  /** Bottom-to-top stack order; the legend follows the same order. */
  series: StackSeries<K>[]
}

/**
 * Weekly stacked columns with a legend that prints each series' total for the
 * window. The totals are the visible labels the palette rules require, so the
 * reading never depends on telling two colors apart.
 */
export function StackedWeeklyChart<K extends string>({ data, series }: StackedWeeklyChartProps<K>) {
  const totals = series.map(s => ({ ...s, total: data.reduce((acc, row) => acc + row[s.key], 0) }))
  const lastKey = series[series.length - 1]?.key

  return (
    <div className="space-y-4">
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {totals.map(s => (
          <li key={s.key} className="flex items-center gap-2">
            <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-medium tabular-nums">{formatInt(s.total)}</span>
          </li>
        ))}
      </ul>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }} barCategoryGap="24%">
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="week" tickFormatter={formatShortDate} {...AXIS_PROPS} minTickGap={12} />
            <YAxis allowDecimals={false} {...AXIS_PROPS} />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))" }}
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={label => `Semana de ${formatShortDate(String(label))}`}
              formatter={(value, name) => [formatInt(Number(value)), name]}
            />
            {series.map(s => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="total"
                fill={s.color}
                stroke="hsl(var(--card))"
                strokeWidth={1}
                radius={s.key === lastKey ? [4, 4, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
