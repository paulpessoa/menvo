"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, Clock, Shield, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

interface AdminStats {
  totalUsers: number
  totalMentors: number
  verifiedMentors: number
  pendingMentors: number
  totalMentees: number
  totalSessions: number
  recentSignups: number
}

export default function AdminDashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalMentors: 0,
    verifiedMentors: 0,
    pendingMentors: 0,
    totalMentees: 0,
    totalSessions: 0,
    recentSignups: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (user?.id) {
      fetchStats()
    }
  }, [user?.id])

  const fetchStats = async () => {
    try {
      // Total de usuários
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })

      // Estatísticas de mentores usando a nova estrutura
      const { data: mentorRoles, error: mentorError } = await supabase
        .from('user_roles')
        .select(`
          profiles!inner(id, verified),
          roles!inner(name)
        `)
        .eq('roles.name', 'mentor')

      if (mentorError) throw mentorError

      const totalMentors = mentorRoles?.length || 0
      const verifiedMentors = mentorRoles?.filter(role => role.profiles?.verified).length || 0
      const pendingMentors = totalMentors - verifiedMentors

      // Mentees
      const { count: totalMentees } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('roles.name', 'mentee')

      // Sessões (appointments)
      const { count: totalSessions } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })

      // Cadastros recentes (últimos 7 dias)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: recentSignups } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString())

      setStats({
        totalUsers: totalUsers || 0,
        totalMentors,
        verifiedMentors,
        pendingMentors,
        totalMentees: totalMentees || 0,
        totalSessions: totalSessions || 0,
        recentSignups: recentSignups || 0,
      })
    } catch (error) {
      console.error("Error fetching admin stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: "Gerenciar Mentores",
      description: "Visualizar e verificar todos os mentores",
      href: "/admin/mentors",
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      title: "Verificar Mentores",
      description: "Aprovar mentores aguardando verificação",
      href: "/admin/mentors/verify",
      icon: Clock,
      color: "bg-yellow-500",
      badge: stats.pendingMentors > 0 ? stats.pendingMentors : undefined,
    },
    {
      title: "Gerenciar Usuários",
      description: "Visualizar e gerenciar todos os usuários da plataforma",
      href: "/admin/users",
      icon: Users,
      color: "bg-blue-500",
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
    <RequireRole roles={['admin']}>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">
              Bem-vindo, {profile?.full_name || "Admin"}!
            </h1>
            <p className="text-muted-foreground">
              Gerencie mentores, usuários e monitore a plataforma Menvo
            </p>
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
                <CardTitle className="text-sm font-medium">Mentores Verificados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.verifiedMentors}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalMentors} mentores no total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mentores Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingMentors}</div>
                <p className="text-xs text-muted-foreground">Aguardando verificação</p>
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
          {stats.pendingMentors > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <CardTitle className="text-yellow-800">Atenção: Mentores Pendentes</CardTitle>
                </div>
                <CardDescription className="text-yellow-700">
                  Existem {stats.pendingMentors} mentores aguardando verificação. Revise e aprove os perfis para
                  manter a qualidade da plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href="/admin/mentors/verify">Verificar Agora</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </RequireRole>
  )
}
