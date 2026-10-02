"use client"

import { MenvoDots } from "@/components/ui/menvo-loader"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import type { TimeSeriesData } from "@/lib/services/admin/reports.service"

import { SERIES } from "@/components/admin/overview/chart-theme"

const COLORS = [SERIES.primary, SERIES.tertiary]

interface AdminReportsChartsProps {
  growthData: TimeSeriesData[]
  pieData: { name: string; value: number }[]
  loading: boolean
}

export function AdminReportsCharts({
  growthData,
  pieData,
  loading
}: AdminReportsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Novos usuários por dia</CardTitle>
          <CardDescription>Novos cadastros no período selecionado</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] pt-4">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <MenvoDots />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={10} tickMargin={10} />
                <YAxis fontSize={10} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}
                />
                <Bar
                  dataKey="count"
                  fill={SERIES.primary}
                  radius={[4, 4, 0, 0]}
                  name="Novos Usuários"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição de perfis</CardTitle>
          <CardDescription>Base total de usuários por papel</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] pt-4">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <MenvoDots />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
