"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RequireRole } from "@/lib/auth/auth-guard"
import {
  adminReportsService,
  type TimeSeriesData,
  type AdminStats
} from "@/lib/services/admin/reports.service"
import {
  Users,
  TrendingUp,
  Download,
  Calendar,
  Loader2,
  RefreshCw,
  PieChart as PieIcon
} from "lucide-react"
import { toast } from "sonner"
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

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"]

export default function AdminReportsPage() {
  // Default para últimos 30 dias
  const [timeRange, setTimeRange] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split("T")[0]
  })
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats["overview"] | null>(null)
  const [growthData, setGrowthData] = useState<TimeSeriesData[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [overview, growth] = await Promise.all([
        adminReportsService.getDashboardStats(),
        adminReportsService.getUserGrowth(timeRange)
      ])

      setStats(overview)
      setGrowthData(growth)
    } catch (error) {
      console.error("Error loading reports:", error)
      toast.error("Erro ao carregar dados reais")
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const pieData = [
    { name: "Mentores", value: stats?.totalMentors || 0 },
    { name: "Mentees", value: stats?.totalMentees || 0 },
  ]

  const exportReport = () => {
    if (!stats) return
    const csvContent = `Data,Contagem\n${growthData.map((d) => `${d.date},${d.count}`).join("\n")}`
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio-menvo-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  return (
    <RequireRole roles={["admin"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Relatórios e Métricas</h1>
              <p className="text-muted-foreground">
                Análise detalhada de crescimento e distribuição da base
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-48 bg-white">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>Últimos 7 dias</SelectItem>
                  <SelectItem value={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>Últimos 30 dias</SelectItem>
                  <SelectItem value={new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>Últimos 90 dias</SelectItem>
                  <SelectItem value="2020-01-01">Desde o início</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchData} variant="outline" size="icon">
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button onClick={exportReport} variant="secondary">
                <Download className="h-4 w-4 mr-2" /> Exportar
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-blue-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total de Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalUsers.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Mentores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalMentors}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Mentees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalMentees}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Growth Chart */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Fluxo de Novos Usuários
                </CardTitle>
                <CardDescription>Novos cadastros no período selecionado</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] pt-4">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={growthData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" fontSize={10} tickMargin={10} />
                            <YAxis fontSize={10} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Novos Usuários" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Distribution Chart */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <PieIcon className="h-5 w-5 text-primary" />
                    Distribuição de Perfis
                </CardTitle>
                <CardDescription>Base total de usuários por papel</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] pt-4">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RequireRole>
  )
}
