"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RequireRole } from "@/lib/auth/auth-guard"
import { adminReportsService, type TimeSeriesData, type AdminStats } from "@/lib/services/admin-reports.service"
import {
  Users,
  Building2,
  TrendingUp,
  Download,
  Calendar,
  Star,
  Activity,
  Loader2,
  RefreshCw,
  Box
} from "lucide-react"
import { toast } from "sonner"

export default function AdminReportsPage() {
  const [timeRange, setTimeRange] = useState("2020-01-01")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats['overview'] | null>(null)
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

  const exportReport = () => {
    if (!stats) return
    const csvContent = `Data,Contagem\n${growthData.map(d => `${d.date},${d.count}`).join('\n')}`
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `crescimento-menvo-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <RequireRole roles={['admin']}>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Métricas da Plataforma</h1>
              <p className="text-muted-foreground">Dados reais sincronizados com o banco de dados</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-48 bg-white">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2020-01-01">Desde 2020 (Início)</SelectItem>
                  <SelectItem value="2023-01-01">Desde 2023</SelectItem>
                  <SelectItem value="2024-01-01">Desde 2024</SelectItem>
                  <SelectItem value="2025-01-01">Último Ano (2025)</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchData} variant="outline" size="icon">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={exportReport} variant="secondary">
                <Download className="h-4 w-4 mr-2" /> Exportar CSV
              </Button>
            </div>
          </div>

          {loading && !stats ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">Buscando histórico desde 2020...</p>
            </div>
          ) : (
            <div className="space-y-8">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-l-4 border-l-blue-600">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-600">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Mentores</CardTitle>
                            <Star className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalMentors}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-purple-600">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Mentees</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalMentees}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-orange-600">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Recursos no Hub</CardTitle>
                            <Box className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalHubResources}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Growth Chart */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <TrendingUp className="text-primary h-5 w-5" /> Crescimento de Novos Usuários
                                </CardTitle>
                                <CardDescription>Novos cadastros mensais agrupados por data de criação</CardDescription>
                            </div>
                            <Badge variant="outline" className="text-primary border-primary">DADOS REAIS</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {growthData.length === 0 ? (
                                <p className="text-center py-10 text-muted-foreground italic">Nenhum dado encontrado para este período.</p>
                            ) : (
                                [...growthData].reverse().map((month) => (
                                    <div key={month.date} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-semibold text-gray-700">{month.date}</span>
                                            <Badge variant="secondary" className="font-bold">+{month.count}</Badge>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border">
                                            <div
                                                className="bg-primary h-full rounded-full transition-all duration-1000 shadow-sm"
                                                style={{ width: `${Math.min((month.count / (stats?.totalUsers || 100)) * 500, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
          )}
        </div>
      </div>
    </RequireRole>
  )
}
