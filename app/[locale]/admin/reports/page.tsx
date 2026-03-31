"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RequireRole } from "@/lib/auth/auth-guard"
import {
  Users,
  Building2,
  UserCheck,
  Clock,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Star,
  Target,
  Award,
  Activity,
  BarChart3,
  PieChart,
  XCircle,
  CheckCircle2
} from "lucide-react"

// Dados mockados para ilustrar o potencial
const mockData = {
  overview: {
    totalUsers: 2847,
    growthUsers: 12.5,
    totalMentors: 342,
    growthMentors: 8.3,
    totalMentees: 1893,
    growthMentees: 15.2,
    totalCompanies: 127,
    growthCompanies: 6.7,
  },
  mentorships: {
    totalSessions: 1456,
    completedSessions: 1289,
    cancelledSessions: 167,
    totalHours: 1089,
    avgDuration: 45,
    completionRate: 88.5,
    cancellationRate: 11.5,
  },
  ratings: {
    avgRating: 4.7,
    totalReviews: 1156,
    distribution: [
      { stars: 5, count: 823, percentage: 71.2 },
      { stars: 4, count: 245, percentage: 21.2 },
      { stars: 3, count: 67, percentage: 5.8 },
      { stars: 2, count: 15, percentage: 1.3 },
      { stars: 1, count: 6, percentage: 0.5 },
    ],
    nps: 78,
  },
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

  const exportReport = () => {
    const csvContent = `
Relatório da Plataforma MENVO
Gerado em: ${new Date().toLocaleString("pt-BR")}

VISÃO GERAL
Total de Usuários,${mockData.overview.totalUsers}
Total de Mentores,${mockData.overview.totalMentors}
Total de Mentees,${mockData.overview.totalMentees}
Empresas Parceiras,${mockData.overview.totalCompanies}

MENTORIAS
Total de Sessões,${mockData.mentorships.totalSessions}
Sessões Completadas,${mockData.mentorships.completedSessions}
Sessões Canceladas,${mockData.mentorships.cancelledSessions}
Total de Horas,${mockData.mentorships.totalHours}
Taxa de Conclusão,${mockData.mentorships.completionRate}%

AVALIAÇÕES
Média de Avaliação,${mockData.ratings.avgRating}
Total de Avaliações,${mockData.ratings.totalReviews}
NPS,${mockData.ratings.nps}
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
              <Button onClick={exportReport}>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockData.overview.totalUsers.toLocaleString()}</div>
                    <div className="flex items-center text-xs text-green-600 mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{mockData.overview.growthUsers}% vs mês anterior
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mentores Ativos</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockData.overview.totalMentors}</div>
                    <div className="flex items-center text-xs text-green-600 mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{mockData.overview.growthMentors}% vs mês anterior
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mentees</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockData.overview.totalMentees.toLocaleString()}</div>
                    <div className="flex items-center text-xs text-green-600 mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{mockData.overview.growthMentees}% vs mês anterior
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Empresas Parceiras</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockData.overview.totalCompanies}</div>
                    <div className="flex items-center text-xs text-green-600 mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{mockData.overview.growthCompanies}% vs mês anterior
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico de Crescimento Mensal */}
              <Card>
                <CardHeader>
                  <CardTitle>Crescimento Mensal</CardTitle>
                  <CardDescription>Evolução de usuários, sessões e horas nos últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockData.monthlyGrowth.map((month) => (
                      <div key={month.month} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{month.month}</span>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>{month.users} usuários</span>
                            <span>{month.sessions} sessões</span>
                            <span>{month.hours}h</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all"
                            style={{ width: `${(month.users / 3000) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tópicos Mais Populares */}
              <Card>
                <CardHeader>
                  <CardTitle>Tópicos Mais Procurados</CardTitle>
                  <CardDescription>Áreas de interesse mais solicitadas nas mentorias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockData.topicsPopularity.map((topic, index) => (
                      <div key={topic.topic} className="flex items-center gap-4">
                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{topic.topic}</span>
                            <span className="text-sm text-muted-foreground">{topic.count} mentorias</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${(topic.count / 342) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mentorias */}
            <TabsContent value="mentorships" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockData.mentorships.totalSessions.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {mockData.mentorships.completedSessions} completadas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Horas de Mentoria</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockData.mentorships.totalHours.toLocaleString()}h</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Média de {mockData.mentorships.avgDuration} min/sessão
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{mockData.mentorships.completionRate}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {mockData.mentorships.completedSessions} de {mockData.mentorships.totalSessions}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Cancelamento</CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{mockData.mentorships.cancellationRate}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {mockData.mentorships.cancelledSessions} canceladas
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Distribuição de Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Sessões</CardTitle>
                  <CardDescription>Status das mentorias realizadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm">Completadas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{mockData.mentorships.completedSessions}</span>
                        <span className="text-xs text-muted-foreground">
                          ({mockData.mentorships.completionRate}%)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm">Canceladas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{mockData.mentorships.cancelledSessions}</span>
                        <span className="text-xs text-muted-foreground">
                          ({mockData.mentorships.cancellationRate}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Avaliações */}
            <TabsContent value="ratings" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
                    <Star className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockData.ratings.avgRating}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= mockData.ratings.avgRating
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
                    <div className="text-2xl font-bold">{mockData.ratings.totalReviews.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">Feedbacks recebidos</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">NPS</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{mockData.ratings.nps}</div>
                    <p className="text-xs text-muted-foreground mt-1">Net Promoter Score</p>
                  </CardContent>
                </Card>
              </div>

              {/* Distribuição de Avaliações */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Avaliações</CardTitle>
                  <CardDescription>Como os usuários avaliam as mentorias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockData.ratings.distribution.map((item) => (
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
            </TabsContent>

            {/* Crescimento */}
            <TabsContent value="growth" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução da Plataforma</CardTitle>
                  <CardDescription>Crescimento nos últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {mockData.monthlyGrowth.map((month, index) => {
                      const prevMonth = index > 0 ? mockData.monthlyGrowth[index - 1] : null
                      const userGrowth = prevMonth
                        ? ((month.users - prevMonth.users) / prevMonth.users) * 100
                        : 0
                      const sessionGrowth = prevMonth
                        ? ((month.sessions - prevMonth.sessions) / prevMonth.sessions) * 100
                        : 0

                      return (
                        <div key={month.month} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{month.month}</h4>
                            {prevMonth && (
                              <div className="flex gap-4 text-xs">
                                <span className="flex items-center gap-1 text-green-600">
                                  <TrendingUp className="h-3 w-3" />
                                  +{userGrowth.toFixed(1)}% usuários
                                </span>
                                <span className="flex items-center gap-1 text-blue-600">
                                  <TrendingUp className="h-3 w-3" />
                                  +{sessionGrowth.toFixed(1)}% sessões
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Usuários</p>
                              <p className="text-2xl font-bold">{month.users.toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Sessões</p>
                              <p className="text-2xl font-bold">{month.sessions}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Horas</p>
                              <p className="text-2xl font-bold">{month.hours}h</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rankings */}
            <TabsContent value="rankings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Mentores */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      Top 5 Mentores
                    </CardTitle>
                    <CardDescription>Mentores mais ativos e bem avaliados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockData.topMentors.map((mentor, index) => (
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
                              <span>{mentor.hours}h</span>
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
                      Top 5 Empresas
                    </CardTitle>
                    <CardDescription>Empresas com mais mentores ativos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockData.topCompanies.map((company, index) => (
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
                              <span>{company.sessions} sessões</span>
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
