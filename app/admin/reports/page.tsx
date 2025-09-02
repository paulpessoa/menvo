"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RequireAdmin } from "@/lib/auth"
import { createClient } from "@/utils/supabase/client"
import { Users, UserCheck, Clock, TrendingUp, Download } from "lucide-react"
import { toast } from "sonner"

interface ReportData {
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  totalMentors: number
  verifiedMentors: number
  pendingVerifications: number
  totalSessions: number
  completedSessions: number
  totalVolunteerHours: number
  usersByRole: { role: string; count: number }[]
  usersByStatus: { status: string; count: number }[]
  monthlyGrowth: { month: string; users: number }[]
}

export default function AdminReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30")
  const supabase = createClient()

  useEffect(() => {
    fetchReportData()
  }, [timeRange])

  const fetchReportData = async () => {
    try {
      setLoading(true)

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - Number.parseInt(timeRange))

      // Fetch total users
      const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

      // Fetch active users
      const { count: activeUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")

      // Fetch new users this month
      const { count: newUsersThisMonth } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString())

      // Fetch mentor stats
      const { count: totalMentors } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "mentor")

      const { count: verifiedMentors } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "mentor")
        .eq("verification_status", "verified")

      const { count: pendingVerifications } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "mentor")
        .eq("verification_status", "pending")

      // Fetch session stats (if table exists)
      let totalSessions = 0
      let completedSessions = 0
      try {
        const { count: total } = await supabase.from("mentorship_sessions").select("*", { count: "exact", head: true })

        const { count: completed } = await supabase
          .from("mentorship_sessions")
          .select("*", { count: "exact", head: true })
          .eq("status", "completed")

        totalSessions = total || 0
        completedSessions = completed || 0
      } catch (error) {
        console.log("Mentorship sessions table not available")
      }

      // Fetch volunteer hours (if table exists)
      let totalVolunteerHours = 0
      try {
        const { data: volunteerData } = await supabase
          .from("volunteer_activities")
          .select("hours")
          .eq("status", "validated")

        totalVolunteerHours = volunteerData?.reduce((sum, activity) => sum + activity.hours, 0) || 0
      } catch (error) {
        console.log("Volunteer activities table not available")
      }

      // Fetch users by role
      const { data: usersByRole } = await supabase.from("profiles").select("role")

      const roleStats = usersByRole?.reduce((acc: any, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1
        return acc
      }, {})

      const usersByRoleArray = Object.entries(roleStats || {}).map(([role, count]) => ({
        role,
        count: count as number,
      }))

      // Fetch users by status
      const { data: usersByStatus } = await supabase.from("profiles").select("status")

      const statusStats = usersByStatus?.reduce((acc: any, user) => {
        acc[user.status] = (acc[user.status] || 0) + 1
        return acc
      }, {})

      const usersByStatusArray = Object.entries(statusStats || {}).map(([status, count]) => ({
        status,
        count: count as number,
      }))

      // Mock monthly growth data (you can implement actual logic)
      const monthlyGrowth = [
        { month: "Jan", users: 45 },
        { month: "Fev", users: 52 },
        { month: "Mar", users: 48 },
        { month: "Abr", users: 61 },
        { month: "Mai", users: 55 },
        { month: "Jun", users: 67 },
      ]

      setReportData({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        totalMentors: totalMentors || 0,
        verifiedMentors: verifiedMentors || 0,
        pendingVerifications: pendingVerifications || 0,
        totalSessions,
        completedSessions,
        totalVolunteerHours,
        usersByRole: usersByRoleArray,
        usersByStatus: usersByStatusArray,
        monthlyGrowth,
      })
    } catch (error) {
      console.error("Erro ao buscar dados do relatório:", error)
      toast.error("Erro ao carregar relatórios")
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    if (!reportData) return

    const csvContent = `
Relatório da Plataforma MENVO
Gerado em: ${new Date().toLocaleString("pt-BR")}

ESTATÍSTICAS GERAIS
Total de Usuários,${reportData.totalUsers}
Usuários Ativos,${reportData.activeUsers}
Novos Usuários (${timeRange} dias),${reportData.newUsersThisMonth}

MENTORES
Total de Mentores,${reportData.totalMentors}
Mentores Verificados,${reportData.verifiedMentors}
Verificações Pendentes,${reportData.pendingVerifications}

SESSÕES
Total de Sessões,${reportData.totalSessions}
Sessões Completadas,${reportData.completedSessions}

VOLUNTARIADO
Total de Horas Voluntárias,${reportData.totalVolunteerHours}

USUÁRIOS POR ROLE
${reportData.usersByRole.map((item) => `${item.role},${item.count}`).join("\n")}

USUÁRIOS POR STATUS
${reportData.usersByStatus.map((item) => `${item.status},${item.count}`).join("\n")}
    `.trim()

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `relatorio-menvo-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("Relatório exportado com sucesso!")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <RequireAdmin>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Relatórios</h1>
              <p className="text-muted-foreground">Métricas e estatísticas da plataforma</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportReport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>

          {reportData && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      +{reportData.newUsersThisMonth} nos últimos {timeRange} dias
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.activeUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      {((reportData.activeUsers / reportData.totalUsers) * 100).toFixed(1)}% do total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mentores Verificados</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.verifiedMentors}</div>
                    <p className="text-xs text-muted-foreground">
                      {reportData.pendingVerifications} aguardando verificação
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Horas Voluntárias</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.totalVolunteerHours}</div>
                    <p className="text-xs text-muted-foreground">Total de horas registradas</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Usuários por Role</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.usersByRole.map((item) => (
                        <div key={item.role} className="flex items-center justify-between">
                          <span className="capitalize">{item.role}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${(item.count / reportData.totalUsers) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium">{item.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Usuários por Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.usersByStatus.map((item) => (
                        <div key={item.status} className="flex items-center justify-between">
                          <span className="capitalize">{item.status}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${(item.count / reportData.totalUsers) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium">{item.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </RequireAdmin>
  )
}
