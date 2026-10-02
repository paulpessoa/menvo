"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { RequireRole } from "@/lib/auth/auth-guard"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { StatTile } from "@/components/admin/overview/StatTile"
import { formatInt } from "@/components/admin/overview/chart-theme"
import { PageContainer } from "@/components/layout/PageContainer"
import {
  adminReportsService,
  type TimeSeriesData,
  type AdminStats
} from "@/lib/services/admin/reports.service"
import dynamic from "next/dynamic"
import { toast } from "sonner"

const AdminReportsCharts = dynamic(
  () => import("@/components/admin/AdminReportsCharts").then((mod) => mod.AdminReportsCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[380px] bg-muted/20 animate-pulse rounded-2xl" />
        <div className="h-[380px] bg-muted/20 animate-pulse rounded-2xl" />
      </div>
    )
  }
)

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
      <PageContainer>
        <AdminPageHeader
          title="Relatórios"
          description="Crescimento e distribuição da base por período, com exportação em CSV."
          actions={
            <>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>Últimos 7 dias</SelectItem>
                  <SelectItem value={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>Últimos 30 dias</SelectItem>
                  <SelectItem value={new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>Últimos 90 dias</SelectItem>
                  <SelectItem value="2020-01-01">Desde o início</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
                {loading ? "Atualizando..." : "Atualizar"}
              </Button>
              <Button onClick={exportReport} variant="outline" size="sm">
                Exportar CSV
              </Button>
            </>
          }
        />

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatTile label="Total de usuários" value={stats ? formatInt(stats.totalUsers) : "-"} />
            <StatTile label="Mentores" value={stats ? formatInt(stats.totalMentors) : "-"} />
            <StatTile label="Mentorados" value={stats ? formatInt(stats.totalMentees) : "-"} />
          </div>

          <AdminReportsCharts
            growthData={growthData}
            pieData={pieData}
            loading={loading}
          />
        </div>
      </PageContainer>
    </RequireRole>
  )
}
