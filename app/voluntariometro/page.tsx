"use client"

import { useMemo } from "react"
import { Activity, TrendingUp, Users, Clock, BarChart3 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { useVolunteerStats } from "@/hooks/api/use-volunteer-activities"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d", "#ffc658"]

export default function VoluntariometroPage() {
  const { data: stats, isLoading } = useVolunteerStats()

  const chartData = useMemo(() => {
    if (!stats) return { monthlyData: [], typeData: [] }

    // Prepare monthly data for chart
    const monthlyData = stats.monthly_stats.slice(-6) // Last 6 months

    // Prepare activity type data for pie chart
    const typeData = stats.activities_by_type.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length],
    }))

    return { monthlyData, typeData }
  }, [stats])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Dados não disponíveis</h3>
          <p className="text-muted-foreground">Não foi possível carregar as estatísticas de voluntariado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Voluntariômetro</h1>
          <p className="text-muted-foreground text-lg">
            Acompanhe o impacto das atividades de voluntariado em nossa comunidade
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Atividades</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_activities}</div>
              <p className="text-xs text-muted-foreground">atividades validadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Voluntários Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_volunteers}</div>
              <p className="text-xs text-muted-foreground">pessoas contribuindo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas Totais</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_hours}h</div>
              <p className="text-xs text-muted-foreground">tempo dedicado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média por Atividade</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_activities > 0 ? (stats.total_hours / stats.total_activities).toFixed(1) : 0}h
              </div>
              <p className="text-xs text-muted-foreground">horas por atividade</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Activities Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Atividades por Mês
              </CardTitle>
              <CardDescription>Evolução das atividades nos últimos meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  activities: {
                    label: "Atividades",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.monthlyData}>
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.split(" ")[0]} // Show only month name
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="activities" fill="var(--color-activities)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Activity Types Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Tipos de Atividades
              </CardTitle>
              <CardDescription>Distribuição por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.typeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ activity_type, percent }) => `${activity_type}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {chartData.typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg p-2 shadow-md">
                              <p className="font-medium">{data.activity_type}</p>
                              <p className="text-sm text-muted-foreground">
                                {data.count} atividades ({data.total_hours}h)
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Activity Types Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Tipo de Atividade</CardTitle>
            <CardDescription>Estatísticas detalhadas de cada categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.activities_by_type.map((type, index) => (
                <div key={type.activity_type} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <div>
                      <h4 className="font-medium">{type.activity_type}</h4>
                      <p className="text-sm text-muted-foreground">{type.count} atividades</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{type.total_hours}h</div>
                    <div className="text-sm text-muted-foreground">
                      {(type.total_hours / type.count).toFixed(1)}h média
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
