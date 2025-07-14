"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { useAdminDashboard } from "@/hooks/api/use-admin"
import { Users, UserCheck, Clock, Activity, TrendingUp, AlertCircle, CheckCircle, Heart } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const { data: dashboardData, isLoading, error } = useAdminDashboard()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Erro ao carregar dashboard</h3>
              <p className="text-muted-foreground">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = dashboardData?.stats || {}

  return (
    <ProtectedRoute requiredPermissions={["admin:dashboard"]}>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
            <p className="text-muted-foreground">Visão geral da plataforma Menvo</p>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Todos os usuários registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mentores</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeMentors}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalMentors} total ({stats.pendingVerifications} pendentes)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Voluntários</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVolunteers}</div>
              <p className="text-xs text-muted-foreground">{stats.pendingActivities} atividades pendentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessões de Mentoria</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedSessions}</div>
              <p className="text-xs text-muted-foreground">{stats.totalSessions} total</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Verificações Pendentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Mentores Pendentes de Verificação
              </CardTitle>
              <CardDescription>Mentores aguardando aprovação manual</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.pendingMentors?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Nenhuma verificação pendente!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData?.pendingMentors?.slice(0, 5).map((mentor: any) => (
                    <div key={mentor.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{mentor.full_name}</p>
                        <p className="text-sm text-muted-foreground">{mentor.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Cadastrado em {new Date(mentor.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">Pendente</Badge>
                        <Button size="sm" asChild>
                          <Link href={`/admin/verifications`}>Verificar</Link>
                        </Button>
                      </div>
                    </div>
                  ))}

                  {(dashboardData?.pendingMentors?.length || 0) > 5 && (
                    <div className="text-center pt-4">
                      <Button variant="outline" asChild>
                        <Link href="/admin/verifications">Ver todas ({dashboardData?.pendingMentors?.length})</Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Atividades Recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Atividades de Voluntariado Recentes
              </CardTitle>
              <CardDescription>Últimas atividades registradas pelos voluntários</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.recentActivities?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhuma atividade registrada ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData?.recentActivities?.slice(0, 5).map((activity: any) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.profiles?.full_name} • {activity.hours}h
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Badge
                        variant={
                          activity.status === "validated"
                            ? "default"
                            : activity.status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {activity.status === "validated"
                          ? "Validada"
                          : activity.status === "rejected"
                            ? "Rejeitada"
                            : "Pendente"}
                      </Badge>
                    </div>
                  ))}

                  <div className="text-center pt-4">
                    <Button variant="outline" asChild>
                      <Link href="/admin/volunteers">Ver todas as atividades</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Links Rápidos */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesso rápido às principais funcionalidades administrativas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" asChild className="h-20 flex-col bg-transparent">
                <Link href="/admin/users">
                  <Users className="h-6 w-6 mb-2" />
                  Gerenciar Usuários
                </Link>
              </Button>

              <Button variant="outline" asChild className="h-20 flex-col bg-transparent">
                <Link href="/admin/verifications">
                  <UserCheck className="h-6 w-6 mb-2" />
                  Verificações
                </Link>
              </Button>

              <Button variant="outline" asChild className="h-20 flex-col bg-transparent">
                <Link href="/admin/volunteers">
                  <Heart className="h-6 w-6 mb-2" />
                  Voluntários
                </Link>
              </Button>

              <Button variant="outline" asChild className="h-20 flex-col bg-transparent">
                <Link href="/admin/reports">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Relatórios
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
