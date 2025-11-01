"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Settings, Clock, CheckCircle, AlertCircle, TrendingUp, Star, MessageCircle } from "lucide-react"
import Link from "next/link"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/client"

interface MentorStats {
    totalAppointments: number
    upcomingAppointments: number
    completedSessions: number
    totalMentees: number
    averageRating: number
    totalReviews: number
}

interface Appointment {
    id: string
    scheduled_at: string
    duration_minutes: number
    status: string
    mentee: {
        full_name: string
        avatar_url: string | null
    }
}

export default function MentorDashboard() {
    const { user, profile, isVerified } = useAuth()
    const [stats, setStats] = useState<MentorStats>({
        totalAppointments: 0,
        upcomingAppointments: 0,
        completedSessions: 0,
        totalMentees: 0,
        averageRating: 0,
        totalReviews: 0
    })
    const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        if (user?.id) {
            fetchMentorStats()
            fetchUpcomingAppointments()
        }
    }, [user?.id])

    const fetchMentorStats = async () => {
        try {
            // Fetch appointments stats
            const { data: appointments, error: appointmentsError } = await supabase
                .from('appointments')
                .select('id, status, scheduled_at')
                .eq('mentor_id', user?.id)

            if (appointmentsError) throw appointmentsError

            const now = new Date()
            const upcoming = appointments?.filter(apt =>
                new Date(apt.scheduled_at) > now && apt.status !== 'cancelled'
            ).length || 0

            const completed = appointments?.filter(apt => apt.status === 'completed').length || 0

            // Count unique mentees
            const { data: uniqueMentees, error: menteesError } = await supabase
                .from('appointments')
                .select('mentee_id')
                .eq('mentor_id', user?.id)
                .neq('status', 'cancelled')

            if (menteesError) throw menteesError

            const totalMentees = new Set(uniqueMentees?.map(apt => apt.mentee_id)).size

            setStats({
                totalAppointments: appointments?.length || 0,
                upcomingAppointments: upcoming,
                completedSessions: completed,
                totalMentees,
                averageRating: profile?.average_rating || 0,
                totalReviews: profile?.total_reviews || 0
            })
        } catch (error) {
            console.error('Error fetching mentor stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchUpcomingAppointments = async () => {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id,
                    scheduled_at,
                    duration_minutes,
                    status,
                    profiles!appointments_mentee_id_fkey (
                        full_name,
                        avatar_url
                    )
                `)
                .eq('mentor_id', user?.id)
                .gte('scheduled_at', new Date().toISOString())
                .neq('status', 'cancelled')
                .order('scheduled_at', { ascending: true })
                .limit(5)

            if (error) throw error

            const formattedAppointments = data?.map(apt => ({
                id: apt.id,
                scheduled_at: apt.scheduled_at,
                duration_minutes: apt.duration_minutes,
                status: apt.status,
                mentee: {
                    full_name: apt.profiles?.full_name || 'Mentee',
                    avatar_url: apt.profiles?.avatar_url
                }
            })) || []

            setUpcomingAppointments(formattedAppointments)
        } catch (error) {
            console.error('Error fetching upcoming appointments:', error)
        }
    }

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Bom dia"
        if (hour < 18) return "Boa tarde"
        return "Boa noite"
    }

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString)
        return {
            date: date.toLocaleDateString('pt-BR'),
            time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
    }

    const quickActions = [
        {
            title: "Configurar Disponibilidade",
            description: "Defina seus horários disponíveis para mentoria",
            href: "/dashboard/mentor/availability",
            icon: Calendar,
            color: "bg-blue-500",
            disabled: !isVerified
        },
        {
            title: "Ver Agendamentos",
            description: "Gerencie suas sessões de mentoria",
            href: "/dashboard/mentor/appointments",
            icon: Clock,
            color: "bg-green-500",
            disabled: !isVerified
        },
        {
            title: "Editar Perfil",
            description: "Atualize suas informações e especialidades",
            href: "/profile",
            icon: Settings,
            color: "bg-purple-500",
            disabled: false
        }
    ]

    return (
        <RequireRole roles={['mentor']}>
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold">
                            {getGreeting()}, {profile?.full_name || "Mentor"}!
                        </h1>
                        <p className="text-muted-foreground">
                            Bem-vindo ao seu dashboard de mentor. Gerencie suas mentorias e ajude outros profissionais.
                        </p>
                    </div>

                    {/* Verification Status */}
                    <Card className={isVerified ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
                        <CardContent className="flex items-center gap-4 p-6">
                            {isVerified ? (
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            ) : (
                                <AlertCircle className="h-8 w-8 text-yellow-600" />
                            )}
                            <div className="flex-1">
                                <h3 className="font-semibold">
                                    {isVerified ? "Perfil Verificado" : "Verificação Pendente"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {isVerified
                                        ? "Seu perfil foi verificado! Você pode receber agendamentos de mentees."
                                        : "Seu perfil está aguardando verificação. Você receberá um email quando for aprovado."
                                    }
                                </p>
                            </div>
                            <Badge variant={isVerified ? "default" : "secondary"}>
                                {isVerified ? "Verificado" : "Pendente"}
                            </Badge>
                        </CardContent>
                    </Card>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Próximas Sessões</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? "..." : stats.upcomingAppointments}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Agendamentos confirmados
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total de Mentees</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? "..." : stats.totalMentees}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Pessoas mentoradas
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Sessões Completas</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? "..." : stats.completedSessions}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Mentorias realizadas
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avaliação</CardTitle>
                                <Star className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? "..." : stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.totalReviews > 0 ? `${stats.totalReviews} avaliações` : "Sem avaliações"}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-6">Ações Rápidas</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {quickActions.map((action, index) => (
                                <Card key={index} className={`hover:shadow-md transition-shadow ${action.disabled ? 'opacity-50' : ''}`}>
                                    <CardHeader>
                                        <div className={`p-2 rounded-lg ${action.color} w-fit`}>
                                            <action.icon className="h-6 w-6 text-white" />
                                        </div>
                                        <CardTitle className="text-lg">{action.title}</CardTitle>
                                        <CardDescription>{action.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button
                                            asChild={!action.disabled}
                                            className="w-full"
                                            disabled={action.disabled}
                                        >
                                            {action.disabled ? (
                                                <span>
                                                    {action.title.includes('Disponibilidade') || action.title.includes('Agendamentos')
                                                        ? 'Aguardando Verificação'
                                                        : 'Acessar'
                                                    }
                                                </span>
                                            ) : (
                                                <Link href={action.href}>
                                                    Acessar
                                                </Link>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Appointments */}
                    {isVerified && upcomingAppointments.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-semibold">Próximos Agendamentos</h2>
                                <Button variant="outline" asChild>
                                    <Link href="/dashboard/mentor/appointments">
                                        Ver Todos
                                    </Link>
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {upcomingAppointments.map((appointment) => {
                                    const { date, time } = formatDateTime(appointment.scheduled_at)
                                    return (
                                        <Card key={appointment.id}>
                                            <CardContent className="flex items-center justify-between p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                        {appointment.mentee.avatar_url ? (
                                                            <img
                                                                src={appointment.mentee.avatar_url}
                                                                alt={appointment.mentee.full_name}
                                                                className="h-10 w-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-sm font-medium">
                                                                {appointment.mentee.full_name.split(' ').map(n => n[0]).join('')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium">{appointment.mentee.full_name}</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {date} às {time} • {appointment.duration_minutes} min
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                                                        {appointment.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                                                    </Badge>
                                                    <Button size="sm" variant="outline">
                                                        <MessageCircle className="h-4 w-4 mr-2" />
                                                        Detalhes
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Getting Started */}
                    {!isVerified && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Primeiros Passos</CardTitle>
                                <CardDescription>
                                    Complete estas etapas para começar a oferecer mentorias
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="text-sm">Cadastro realizado</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="text-sm">Papel de mentor selecionado</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                                    <span className="text-sm">Aguardando verificação do perfil</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                    <span className="text-sm text-muted-foreground">Configurar disponibilidade</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                    <span className="text-sm text-muted-foreground">Receber primeiro agendamento</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </RequireRole>
    )
}