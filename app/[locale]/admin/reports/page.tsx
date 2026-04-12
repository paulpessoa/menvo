"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RequireRole } from "@/lib/auth/auth-guard"
import { adminReportsService, AdminStats } from "@/lib/services/admin-reports.service"
import {
  Users,
  Building2,
  UserCheck,
  Clock,
  TrendingUp,
  Download,
  Calendar,
  Star,
  Target,
  Award,
  Activity,
  XCircle,
  CheckCircle2,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

// Dados mockados para o que ainda não implementamos (Rankings e Crescimento)
const mockRankingsData = {
  topMentors: [
    { name: "Maria Santos", sessions: 89, rating: 4.9, hours: 67 },
    { name: "João Silva", sessions: 76, rating: 4.8, hours: 57 },
    { name: "Ana Costa", sessions: 68, rating: 4.9, hours: 51 },
    { name: "Pedro Oliveira", sessions: 62, rating: 4.7, hours: 47 },
    { name: "Carla Souza", sessions: 58, rating: 4.8, hours: 44 },
  ],
  topCompanies: [
    { name: "Tech Corp", mentors: 23, sessions: 187 },
    { name: "Startup Hub", mentors: 18, sessions: 142 },
    { name: "Innovation Labs", mentors: 15, sessions: 128 },
    { name: "Digital Solutions", mentors: 12, sessions: 98 },
    { name: "Future Tech", mentors: 11, sessions: 87 },
  ],
  monthlyGrowth: [
    { month: "Jan", users: 2234, sessions: 98, hours: 74 },
    { month: "Fev", users: 2356, sessions: 112, hours: 84 },
    { month: "Mar", users: 2489, sessions: 128, hours: 96 },
    { month: "Abr", users: 2598, sessions: 145, hours: 109 },
    { month: "Mai", users: 2712, sessions: 167, hours: 125 },
    { month: "Jun", users: 2847, sessions: 189, hours: 142 },
  ],
  topicsPopularity: [
    { topic: "Carreira em Tech", count: 342 },
    { topic: "Transição de Carreira", count: 289 },
    { topic: "Liderança", count: 234 },
    { topic: "Desenvolvimento Pessoal", count: 198 },
    { topic: "Empreendedorismo", count: 167 },
    { topic: "Programação", count: 145 },
  ],
}

export default function AdminReportsPage() {
  const [timeRange, setTimeRange] = useState("30")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [overview, mentorships, ratings] = await Promise.all([
        adminReportsService.getOverviewStats(),
        adminReportsService.getMentorshipStats(),
        adminReportsService.getRatingStats()
      ])

      setStats({ overview, mentorships, ratings })
    } catch (error) {
      console.error("Error loading reports:", error)
      toast.error("Erro ao carregar dados do relatório")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const exportReport = () => {
    if (!stats) return

    const csvContent = `
Relatório da Plataforma MENVO
Gerado em: ${new Date().toLocaleString("pt-BR")}

VISÃO GERAL
Total de Usuários,${stats.overview.totalUsers}
Total de Mentores,${stats.overview.totalMentors}
Total de Mentees,${stats.overview.totalMentees}
Empresas Parceiras,${stats.overview.totalCompanies}

MENTORIAS
Total de Sessões,${stats.mentorships.totalSessions}
Sessões Completadas,${stats.mentorships.completedSessions}
Sessões Canceladas,${stats.mentorships.cancelledSessions}
Total de Horas,${stats.mentorships.totalHours}
Taxa de Conclusão,${stats.mentorships.completionRate}%

AVALIAÇÕES
Média de Avaliação,${stats.ratings.avgRating}
Total de Avaliações,${stats.ratings.totalReviews}
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
  }

  if (loading && !stats) {
    return (
      <RequireRole roles={['admin']}>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 font-medium">Carregando métricas reais...</span>
        </div>
      </RequireRole>
    )
  }

  return (
    <RequireRole roles={['admin']}>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Relatórios e Métricas</h1>
              <p className="text-muted-foreground">Análise completa da plataforma MENVO</p>
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
              <Button onClick={exportReport} disabled={!stats}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="mentorships">Mentorias</TabsTrigger>
              <TabsTrigger value="ratings">Avaliações</TabsTrigger>
              <TabsTrigger value="growth">Crescimento</TabsTrigger>
              <TabsTrigger value="rankings">Rankings</TabsTrigger>
            </TabsList>

            {/* Visão Geral */}
            <TabsContent value="overview" className="space-y-6">
              {/* KPIs Principais */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.overview.totalUsers.toLocaleString()}</div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        Dados reais do sistema
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Mentores Ativos</CardTitle>
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.overview.totalMentors}</div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        Mentores registrados
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Mentees</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.overview.totalMentees.toLocaleString()}</div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        Mentorizados registrados
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Empresas Parceiras</CardTitle>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.overview.totalCompanies}</div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        Com empresa no perfil
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Gráfico de Crescimento Mensal (Ainda Mock) */}
              <Card>
                <CardHeader>
                  <CardTitle>Crescimento Mensal</CardTitle>
                  <CardDescription>Evolução de usuários, sessões e horas nos últimos 6 meses (Projeção)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-muted-foreground">
                    {mockRankingsData.monthlyGrowth.map((month) => (
                      <div key={month.month} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{month.month}</span>
                          <div className="flex gap-4 text-xs">
                            <span>{month.users} usuários</span>
                            <span>{month.sessions} sessões</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-primary/30 h-2 rounded-full transition-all"
                            style={{ width: `${(month.users / 3000) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mentorias */}
            <TabsContent value="mentorships" className="space-y-6">
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.mentorships.totalSessions.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.mentorships.completedSessions} completadas
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Horas de Mentoria</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.mentorships.totalHours.toLocaleString()}h</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Baseado em sessões completadas
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{stats.mentorships.completionRate}%</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.mentorships.completedSessions} de {stats.mentorships.totalSessions}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Taxa de Cancelamento</CardTitle>
                      <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{stats.mentorships.cancellationRate}%</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.mentorships.cancelledSessions} canceladas
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Avaliações */}
            <TabsContent value="ratings" className="space-y-6">
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
                      <Star className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.ratings.avgRating}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${star <= stats.ratings.avgRating
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-gray-300"
                              }`}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.ratings.totalReviews.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground mt-1">Feedbacks reais</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">NPS</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">--</div>
                      <p className="text-xs text-muted-foreground mt-1">Em breve</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Distribuição de Avaliações */}
              {stats && stats.ratings.distribution.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição de Avaliações</CardTitle>
                    <CardDescription>Como os usuários avaliam as mentorias reais</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.ratings.distribution.map((item) => (
                        <div key={item.stars} className="flex items-center gap-4">
                          <div className="flex items-center gap-1 w-20">
                            <span className="text-sm font-medium">{item.stars}</span>
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          </div>
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-yellow-500 h-3 rounded-full transition-all"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-24 text-right">
                            <span className="text-sm font-medium">{item.count}</span>
                            <span className="text-xs text-muted-foreground ml-1">({item.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Crescimento (Ainda Mock para MVP) */}
            <TabsContent value="growth" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução da Plataforma</CardTitle>
                  <CardDescription>Crescimento nos últimos meses (Simulado)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {mockRankingsData.monthlyGrowth.map((month, index) => {
                      return (
                        <div key={month.month} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{month.month}</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Usuários</p>
                              <p className="text-2xl font-bold">{month.users.toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Sessões</p>
                              <p className="text-2xl font-bold">{month.sessions}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rankings (Ainda Mock para MVP) */}
            <TabsContent value="rankings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Mentores */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      Top 5 Mentores (Exemplo)
                    </CardTitle>
                    <CardDescription>Mentores com mais sessões cadastradas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockRankingsData.topMentors.map((mentor, index) => (
                        <div key={mentor.name} className="flex items-center gap-4">
                          <Badge
                            variant={index === 0 ? "default" : "outline"}
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                          >
                            {index + 1}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{mentor.name}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span>{mentor.sessions} sessões</span>
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                {mentor.rating}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Empresas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-500" />
                      Top 5 Empresas (Exemplo)
                    </CardTitle>
                    <CardDescription>Empresas representadas na plataforma</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockRankingsData.topCompanies.map((company, index) => (
                        <div key={company.name} className="flex items-center gap-4">
                          <Badge
                            variant={index === 0 ? "default" : "outline"}
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                          >
                            {index + 1}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{company.name}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span>{company.mentors} mentores</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RequireRole>
  )
}
