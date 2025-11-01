"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, CheckCircle, Clock, Settings, Shield, BarChart3, AlertTriangle, TrendingUp, Calendar, Loader2 } from "lucide-react"
import Link from "next/link"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/client"

interface AdminStats {
    totalUsers: number
    totalMentors: number
    totalMentees: number
    pendingMentors: number
    verifiedMentors: number
    totalAppointments: number
    appointmentsThisMonth: number
    completedSessions: number
}

interface PendingMentor {
    id: string
    full_name: string
    avatar_url: string | null
    job_title: string | null
    company: string | null
    created_at: string
}

interface RecentActivity {
    id: string
    type: 'registration' | 'appointment' | 'verification'
    description: string
    timestamp: string
    user?: {
        full_name: string
        avatar_url: string | null
    }
}

export default function AdminDashboard() {
    const { user, profile } = useAuth()
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        totalMentors: 0,
        totalMentees: 0,
        pendingMentors: 0,
        verifiedMentors: 0,
        totalAppointments: 0,
        appointmentsThisMonth: 0,
        completedSessions: 0
    })
    const [pendingMentors, setPendingMentors] = useState<PendingMentor[]>([])
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
    const [loading, setLoading] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        if (user?.id) {
            fetchAdminStats()
            fetchPendingMentors()
            fetchRecentActivity()
        }
    }, [user?.id])

    const fetchAdminStats = async () => {
        try {
            // Fetch total users
            const { count: totalUsers, error: usersError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })

            if (usersError) throw usersError

            // Fetch mentors stats
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

            // Fetch mentees stats
            const { count: totalMentees, error: menteesError } = await supabase
                .from('user_roles')
                .select('*', { count: 'exact', head: true })
                .eq('roles.name', 'mentee')

            if (menteesError) throw menteesError

            // Fetch appointments stats
            const { data: appointments, error: appointmentsError } = await supabase
                .from('appointments')
                .select('id, status, scheduled_at, created_at')

            if (appointmentsError) throw appointmentsError

            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

            const appointmentsThisMonth = appointments?.filter(apt =>
                new Date(apt.created_at) >= startOfMonth
            ).length || 0

            const completedSessions = appointments?.filter(apt => apt.status === 'completed').length || 0

            setStats({
                totalUsers: totalUsers || 0,
                totalMentors,
                totalMentees: totalMentees || 0,
                pendingMentors,
                verifiedMentors,
                totalAppointments: appointments?.length || 0,
                appointmentsThisMonth,
                completedSessions
            })
        } catch (error) {
            console.error('Error fetching admin stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchPendingMentors = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id,
                    full_name,
                    avatar_url,
                    job_title,
                    company,
                    created_at,
                    user_roles!inner(
                        roles!inner(name)
                    )
                `)
                .eq('verified', false)
                .eq('user_roles.roles.name', 'mentor')
                .order('created_at', { ascending: false })
                .limit(5)

            if (error) throw error

            setPendingMentors(data || [])
        } catch (error) {
            console.error('Error fetching pending mentors:', error)
        }
    }

    const fetchRecentActivity = async () => {
        try {
            // This is a simplified version - in a real app you'd have an activity log table
            const { data: recentUsers, error: usersError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, created_at')
                .order('created_at', { ascending: false })
                .limit(5)

            if (usersError) throw usersError

            const activities: RecentActivity[] = recentUsers?.map(user => ({
                id: user.id,
                type: 'registration' as const,
                description: `${user.full_name} se cadastrou na plataforma`,
                timestamp: user.created_at,
                user: {
                    full_name: user.full_name,
                    avatar_url: user.avatar_url
                }
            })) || []

            setRecentActivity(activities)
        } catch (error) {
            console.error('Error fetching recent activity:', error)
        }
    }

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Bom dia"
        if (hour < 18) return "Boa tarde"
        return "Boa noite"
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const quickActions = [
        {
            title: "Gerenciar Mentores",
            description: "Visualizar e verificar todos os mentores",
            href: "/admin/mentors",
            icon: CheckCircle,
            color: "bg-green-500"
        },
        {
            title: "Verificar Mentores",
            description: "Revisar e aprovar mentores pendentes",
            href: "/admin/mentors/verify",
            icon: Clock,
            color: "bg-yellow-500"
        },
        {
            title: "Gerenciar Usuários",
            description: "Visualizar e gerenciar todos os usuários",
            href: "/admin/users",
            icon: Users,
            color: "bg-blue-500"
        },
        {
            title: "Configurações",
            description: "Configurar parâmetros da plataforma",
            href: "/admin/settings",
            icon: Settings,
            color: "bg-gray-500"
        }
    ]

    return (
        <RequireRole roles={['admin']}>
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold">
                            {getGreeting()}, {profile?.full_name || "Admin"}!
                        </h1>
                        <p className="text-muted-foreground">
                            Bem-vindo ao painel administrativo. Gerencie a plataforma e seus usuários.
                        </p>
                    </div>

                    {/* Admin Badge */}
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="flex items-center gap-4 p-6">
                            <Shield className="h-8 w-8 text-red-600" />
                            <div className="flex-1">
                                <h3 className="font-semibold">Acesso Administrativo</h3>
                                <p className="text-sm text-muted-foreground">
                                    Você tem privilégios de administrador na plataforma.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Usuários</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? "..." : stats.totalUsers}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.totalMentors} mentores • {stats.totalMentees} mentees
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Mentores Pendentes</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? "..." : stats.pendingMentors}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Aguardando verificação
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Mentores Ativos</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? "..." : stats.verifiedMentors}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Mentores verificados
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? "..." : stats.appointmentsThisMonth}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Este mês • {stats.completedSessions} completas
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-6">Ações Administrativas</h2>
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
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Pending Mentors Section */}
                    {stats.pendingMentors > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-semibold">Mentores Pendentes</h2>
                                    <p className="text-muted-foreground">
                                        Mentores aguardando verificação
                                    </p>
                                </div>
                                <Button asChild>
                                    <Link href="/admin/mentors/verify">
                                        Ver Todos ({stats.pendingMentors})
                                    </Link>
                                </Button>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {pendingMentors.map((mentor) => (
                                        <Card key={mentor.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={mentor.avatar_url || undefined} />
                                                        <AvatarFallback>
                                                            {mentor.full_name?.split(' ').map(n => n[0]).join('') || 'M'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-medium truncate">{mentor.full_name}</h3>
                                                        {mentor.job_title && (
                                                            <p className="text-sm text-muted-foreground truncate">
                                                                {mentor.job_title}
                                                                {mentor.company && ` @ ${mentor.company}`}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Cadastrado em {formatDate(mentor.created_at)}
                                                        </p>
                                                        <div className="flex gap-2 mt-3">
                                                            <Button size="sm" className="flex-1">
                                                                Verificar
                                                            </Button>
                                                            <Button size="sm" variant="outline">
                                                                Ver Perfil
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Platform Metrics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Métricas da Plataforma
                                </CardTitle>
                                <CardDescription>
                                    Estatísticas gerais de uso
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Total de Agendamentos</span>
                                    <Badge variant="outline">{stats.totalAppointments}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Sessões Completadas</span>
                                    <Badge variant="outline">{stats.completedSessions}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Taxa de Conclusão</span>
                                    <Badge variant="outline">
                                        {stats.totalAppointments > 0
                                            ? Math.round((stats.completedSessions / stats.totalAppointments) * 100)
                                            : 0
                                        }%
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Mentores Verificados</span>
                                    <Badge variant="outline">
                                        {stats.totalMentors > 0
                                            ? Math.round((stats.verifiedMentors / stats.totalMentors) * 100)
                                            : 0
                                        }%
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Atividade Recente</CardTitle>
                                <CardDescription>
                                    Últimas ações na plataforma
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                ) : recentActivity.length > 0 ? (
                                    <div className="space-y-4">
                                        {recentActivity.map((activity) => (
                                            <div key={activity.id} className="flex items-start gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={activity.user?.avatar_url || undefined} />
                                                    <AvatarFallback className="text-xs">
                                                        {activity.user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm">{activity.description}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(activity.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            Nenhuma atividade recente
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>


                </div>
            </div>
        </RequireRole>
    )
}