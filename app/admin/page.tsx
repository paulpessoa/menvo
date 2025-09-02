"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, Clock, Shield, TrendingUp, AlertCircle } from "lucide-react"
import Link from "next/link"
import { RequireAdmin } from "@/lib/auth"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

interface AdminStats {
  totalUsers: number
  pendingVerifications: number
  activeMentors: number
  totalSessions: number
  recentSignups: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingVerifications: 0,
    activeMentors: 0,
    totalSessions: 0,
    recentSignups: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Total de usuários
        const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

        // Verificações pendentes
        const { count: pendingVerifications } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "mentor")
          .eq("verification_status", "pending")

        // Mentores ativos
        const { count: activeMentors } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "mentor")
          .eq("verification_status", "approved")

        // Cadastros recentes (últimos 7 dias)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { count: recentSignups } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo.toISOString())

        setStats({
          totalUsers: totalUsers || 0,
          pendingVerifications: pendingVerifications || 0,
          activeMentors: activeMentors || 0,
          totalSessions: 0, // TODO: Implementar quando tiver tabela de sessões
          recentSignups: recentSignups || 0,
        })
      } catch (error) {
        console.error("Error fetching admin stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const quickActions = [
    {
      title: "Gerenciar Usuários",
      description: "Visualizar e gerenciar todos os usuários da plataforma",
      href: "/admin/users",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Verificações Pendentes",
      description: "Aprovar ou rejeitar mentores aguardando verificação",
      href: "/admin/verifications",
      icon: UserCheck,
      color: "bg-orange-500",
      badge: stats.pendingVerifications > 0 ? stats.pendingVerifications : undefined,
    },
    {
      title: "Relatórios",
      description: "Visualizar métricas e relatórios da plataforma",
      href: "/admin/reports",
      icon: TrendingUp,
      color: "bg-green-500",
    },
    {
      title: "Configurações",
      description: "Configurações gerais do sistema",
      href: "/admin/settings",
      icon: Shield,
      color: "bg-purple-500",
    },
  ]

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
          <div>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground">Gerencie usuários, verificações e monitore a plataforma</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">+{stats.recentSignups} nos últimos 7 dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mentores Ativos</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeMentors}</div>
                <p className="text-xs text-muted-foreground">Mentores verificados e ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verificações Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.pendingVerifications}</div>
                <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessões Realizadas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSessions}</div>
                <p className="text-xs text-muted-foreground">Total de mentorias realizadas</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      {action.badge && <Badge variant="destructive">{action.badge}</Badge>}
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href={action.href}>Acessar</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Alerts */}
          {stats.pendingVerifications > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-orange-800">Atenção: Verificações Pendentes</CardTitle>
                </div>
                <CardDescription className="text-orange-700">
                  Existem {stats.pendingVerifications} mentores aguardando verificação. Revise e aprove os perfis para
                  manter a qualidade da plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href="/admin/verifications">Revisar Agora</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </RequireAdmin>
  )
}
