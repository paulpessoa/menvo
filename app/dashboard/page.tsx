"use client"

import { useRouter } from "next/navigation"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, MessageSquare, Star, ArrowRight, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { useAuth } from "@/hooks/useAuth"
import { usePermissions } from "@/hooks/usePermissions"
import { supabase } from "@/services/auth/supabase"

interface DashboardStats {
  totalSessions: number
  upcomingSessions: number
  completedSessions: number
  avgRating: number
  totalHours: number
  activeConnections: number
}

interface UpcomingSession {
  id: string
  title: string
  date: string
  time: string
  mentor_name?: string
  mentee_name?: string
  status: string
}

export default function Dashboard() {
  const { profile, user, hasRole, isAuthenticated } = useAuth()
  const { canProvideMentorship, canBookSessions } = usePermissions()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    avgRating: 0,
    totalHours: 0,
    activeConnections: 0,
  })
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDashboardData()
    }
  }, [isAuthenticated, user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Load user stats based on role
      if (hasRole("mentor")) {
        await loadMentorStats()
      } else if (hasRole("mentee")) {
        await loadMenteeStats()
      }

      // Load upcoming sessions
      await loadUpcomingSessions()
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMentorStats = async () => {
    if (!user) return

    // Get mentor sessions stats
    const { data: sessions } = await supabase.from("mentorship_sessions").select("*").eq("mentor_id", user.id)

    const totalSessions = sessions?.length || 0
    const completedSessions = sessions?.filter((s) => s.status === "completed").length || 0
    const upcomingSessions = sessions?.filter((s) => s.status === "scheduled").length || 0

    // Calculate average rating
    const ratingsData = sessions?.filter((s) => s.rating).map((s) => s.rating) || []
    const avgRating = ratingsData.length > 0 ? ratingsData.reduce((a, b) => a + b, 0) / ratingsData.length : 0

    // Calculate total hours
    const totalHours =
      sessions?.reduce((total, session) => {
        return total + (session.duration_minutes || 60)
      }, 0) / 60 || 0

    setStats({
      totalSessions,
      upcomingSessions,
      completedSessions,
      avgRating,
      totalHours,
      activeConnections: 0, // Will be implemented later
    })
  }

  const loadMenteeStats = async () => {
    if (!user) return

    // Get mentee sessions stats
    const { data: sessions } = await supabase.from("mentorship_sessions").select("*").eq("mentee_id", user.id)

    const totalSessions = sessions?.length || 0
    const completedSessions = sessions?.filter((s) => s.status === "completed").length || 0
    const upcomingSessions = sessions?.filter((s) => s.status === "scheduled").length || 0

    // Calculate total hours
    const totalHours =
      sessions?.reduce((total, session) => {
        return total + (session.duration_minutes || 60)
      }, 0) / 60 || 0

    setStats({
      totalSessions,
      upcomingSessions,
      completedSessions,
      avgRating: 0,
      totalHours,
      activeConnections: 0,
    })
  }

  const loadUpcomingSessions = async () => {
    if (!user) return

    const { data: sessions } = await supabase
      .from("mentorship_sessions")
      .select(`
        *,
        mentor:user_profiles!mentor_id(first_name, last_name),
        mentee:user_profiles!mentee_id(first_name, last_name)
      `)
      .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
      .eq("status", "scheduled")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5)

    const formattedSessions =
      sessions?.map((session) => ({
        id: session.id,
        title: session.title || "Sessão de Mentoria",
        date: new Date(session.scheduled_at).toLocaleDateString("pt-BR"),
        time: new Date(session.scheduled_at).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        mentor_name: session.mentor ? `${session.mentor.first_name} ${session.mentor.last_name}` : undefined,
        mentee_name: session.mentee ? `${session.mentee.first_name} ${session.mentee.last_name}` : undefined,
        status: session.status,
      })) || []

    setUpcomingSessions(formattedSessions)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Bom dia"
    if (hour < 18) return "Boa tarde"
    return "Boa noite"
  }

  const quickActions = [
    ...(canBookSessions
      ? [
          {
            title: "Encontrar Mentores",
            description: "Busque mentores em sua área de interesse",
            href: "/mentors",
            icon: Users,
            color: "bg-blue-500",
          },
        ]
      : []),
    ...(canProvideMentorship
      ? [
          {
            title: "Gerenciar Disponibilidade",
            description: "Configure seus horários disponíveis",
            href: "/mentor/availability",
            icon: Calendar,
            color: "bg-green-500",
          },
        ]
      : []),
    {
      title: "Mensagens",
      description: "Veja suas conversas ativas",
      href: "/messages",
      icon: MessageSquare,
      color: "bg-purple-500",
    },
    {
      title: "Perfil",
      description: "Atualize suas informações",
      href: "/profile",
      icon: Star,
      color: "bg-orange-500",
    },
  ]

  const recentActivity = [
    // TODO: Buscar atividades recentes do banco de dados
  ]

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const StatCard = ({ title, value, description, icon: Icon, trend }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center pt-1">
            <Clock className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-xs text-green-500">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <ProtectedRoute requiredRoles={["mentor", "mentee", "admin", "volunteer"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">
              {getGreeting()}, {profile?.full_name || "Usuário"}!
            </h1>
            <p className="text-muted-foreground">
              Bem-vindo ao seu dashboard. Aqui você pode gerenciar suas atividades na plataforma.
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Perfil"
              value={profile?.profile_completed ? "Completo" : "Incompleto"}
              description="Status do seu perfil"
              icon={CheckCircle}
            />

            {profile?.role === "mentor" && (
              <StatCard
                title="Verificação"
                value={
                  profile.verification_status === "approved"
                    ? "✓"
                    : profile.verification_status === "pending"
                      ? "⏳"
                      : "✗"
                }
                description="Status da verificação"
                icon={Badge}
                trend={
                  profile.verification_status === "approved"
                    ? "Aprovado"
                    : profile.verification_status === "pending"
                      ? "Pendente"
                      : "Rejeitado"
                }
              />
            )}

            <StatCard title="Sessões" value={stats.upcomingSessions} description="Próximas sessões" icon={Calendar} />
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className={`p-2 rounded-lg ${action.color} w-fit`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href={action.href}>
                        Acessar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Upcoming Sessions */}
          {upcomingSessions.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Próximas Sessões</h2>
              <div className="space-y-4">
                {upcomingSessions.map((session, index) => (
                  <Card key={index}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{session.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {session.date} às {session.time}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline">Ver Detalhes</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Atividade Recente</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                        <div className="p-2 bg-muted rounded-lg">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{/* activity.description */ "Descrição da atividade"}</p>
                          <p className="text-xs text-muted-foreground">{/* activity.date */ "Data da atividade"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty State */}
          {upcomingSessions.length === 0 && recentActivity.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma atividade recente</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Comece explorando mentores ou configurando sua disponibilidade.
                </p>
                <Button asChild>
                  <Link href="/mentors">Explorar Mentores</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
