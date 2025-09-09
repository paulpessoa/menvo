"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Users, Search, Clock, CheckCircle, ArrowRight, Star, MessageCircle, Heart, Loader2 } from "lucide-react"
import Link from "next/link"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/client"

interface MenteeStats {
    totalAppointments: number
    upcomingAppointments: number
    completedSessions: number
    totalMentors: number
    totalHours: number
}

interface Appointment {
    id: string
    scheduled_at: string
    duration_minutes: number
    status: string
    mentor: {
        full_name: string
        avatar_url: string | null
        job_title: string | null
    }
}

interface FeaturedMentor {
    id: string
    full_name: string
    avatar_url: string | null
    job_title: string | null
    company: string | null
    average_rating: number
    total_reviews: number
    mentorship_topics: string[] | null
    slug: string | null
}

export default function MenteeDashboard() {
    const { user, profile } = useAuth()
    const [stats, setStats] = useState<MenteeStats>({
        totalAppointments: 0,
        upcomingAppointments: 0,
        completedSessions: 0,
        totalMentors: 0,
        totalHours: 0
    })
    const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
    const [featuredMentors, setFeaturedMentors] = useState<FeaturedMentor[]>([])
    const [loading, setLoading] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        if (user?.id) {
            fetchMenteeStats()
            fetchUpcomingAppointments()
            fetchFeaturedMentors()
        }
    }, [user?.id])

    const fetchMenteeStats = async () => {
        try {
            // Fetch appointments stats
            const { data: appointments, error: appointmentsError } = await supabase
                .from('appointments')
                .select('id, status, scheduled_at, duration_minutes, mentor_id')
                .eq('mentee_id', user?.id)

            if (appointmentsError) throw appointmentsError

            const now = new Date()
            const upcoming = appointments?.filter(apt =>
                new Date(apt.scheduled_at) > now && apt.status !== 'cancelled'
            ).length || 0

            const completed = appointments?.filter(apt => apt.status === 'completed').length || 0

            // Calculate total hours
            const totalMinutes = appointments?.filter(apt => apt.status === 'completed')
                .reduce((sum, apt) => sum + apt.duration_minutes, 0) || 0
            const totalHours = Math.round(totalMinutes / 60 * 10) / 10 // Round to 1 decimal

            // Count unique mentors
            const uniqueMentors = new Set(appointments?.map(apt => apt.mentor_id)).size

            setStats({
                totalAppointments: appointments?.length || 0,
                upcomingAppointments: upcoming,
                completedSessions: completed,
                totalMentors: uniqueMentors,
                totalHours
            })
        } catch (error) {
            console.error('Error fetching mentee stats:', error)
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
                    profiles!appointments_mentor_id_fkey (
                        full_name,
                        avatar_url,
                        job_title
                    )
                `)
                .eq('mentee_id', user?.id)
                .gte('scheduled_at', new Date().toISOString())
                .neq('status', 'cancelled')
                .order('scheduled_at', { ascending: true })
                .limit(3)

            if (error) throw error

            const formattedAppointments = data?.map(apt => ({
                id: apt.id,
                scheduled_at: apt.scheduled_at,
                duration_minutes: apt.duration_minutes,
                status: apt.status,
                mentor: {
                    full_name: apt.profiles?.full_name || 'Mentor',
                    avatar_url: apt.profiles?.avatar_url,
                    job_title: apt.profiles?.job_title
                }
            })) || []

            setUpcomingAppointments(formattedAppointments)
        } catch (error) {
            console.error('Error fetching upcoming appointments:', error)
        }
    }

    const fetchFeaturedMentors = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id,
                    full_name,
                    avatar_url,
                    job_title,
                    company,
                    average_rating,
                    total_reviews,
                    mentorship_topics,
                    slug,
                    user_roles!inner(
                        roles!inner(name)
                    )
                `)
                .eq('verified', true)
                .eq('user_roles.roles.name', 'mentor')
                .order('average_rating', { ascending: false })
                .limit(3)

            if (error) throw error

            setFeaturedMentors(data || [])
        } catch (error) {
            console.error('Error fetching featured mentors:', error)
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
            title: "Encontrar Mentores",
            description: "Busque mentores verificados em sua área de interesse",
            href: "/mentors",
            icon: Search,
            color: "bg-blue-500"
        },
        {
            title: "Meus Agendamentos",
            description: "Veja suas sessões de mentoria agendadas",
            href: "/mentee/appointments",
            icon: Calendar,
            color: "bg-green-500"
        },
        {
            title: "Editar Perfil",
            description: "Atualize suas informações e interesses",
            href: "/profile",
            icon: Users,
            color: "bg-purple-500"
        }
    ]

    return (
        <RequireRole roles={['mentee']}>
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold">
                            {getGreeting()}, {profile?.full_name || "Mentee"}!
                        </h1>
                        <p className="text-muted-foreground">
                            Bem-vindo ao seu dashboard. Encontre mentores e acelere seu crescimento profissional.
                        </p>
                    </div>

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
                                <CardTitle className="text-sm font-medium">Mentores</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? "..." : stats.totalMentors}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Mentores conectados
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Sessões Completas</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
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
                                <CardTitle className="text-sm font-medium">Horas de Mentoria</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? "..." : stats.totalHours}h
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Total de aprendizado
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-6">Ações Rápidas</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                    {/* Upcoming Appointments */}
                    {upcomingAppointments.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-semibold">Próximas Sessões</h2>
                                <Button variant="outline" asChild>
                                    <Link href="/mentee/appointments">
                                        Ver Todas
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
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarImage src={appointment.mentor.avatar_url || undefined} />
                                                        <AvatarFallback>
                                                            {appointment.mentor.full_name.split(' ').map(n => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h3 className="font-medium">{appointment.mentor.full_name}</h3>
                                                        {appointment.mentor.job_title && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {appointment.mentor.job_title}
                                                            </p>
                                                        )}
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
                    <Card>
                        <CardHeader>
                            <CardTitle>Primeiros Passos</CardTitle>
                            <CardDescription>
                                Complete estas etapas para aproveitar ao máximo a plataforma
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-sm">Cadastro realizado</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-sm">Papel de mentee selecionado</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                <span className="text-sm text-muted-foreground">Complete seu perfil</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                <span className="text-sm text-muted-foreground">Encontre seu primeiro mentor</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                <span className="text-sm text-muted-foreground">Agende sua primeira sessão</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Featured Mentors */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-semibold">Mentores em Destaque</h2>
                                <p className="text-muted-foreground">
                                    Conheça alguns dos nossos mentores mais bem avaliados
                                </p>
                            </div>
                            <Button variant="outline" asChild>
                                <Link href="/mentors">
                                    Ver Todos
                                </Link>
                            </Button>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : featuredMentors.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {featuredMentors.map((mentor) => (
                                    <Card key={mentor.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={mentor.avatar_url || undefined} />
                                                    <AvatarFallback>
                                                        {mentor.full_name.split(' ').map(n => n[0]).join('')}
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

                                                    {mentor.average_rating > 0 && (
                                                        <div className="flex items-center gap-1 mt-2">
                                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                            <span className="text-sm font-medium">
                                                                {mentor.average_rating.toFixed(1)}
                                                            </span>
                                                            <span className="text-sm text-muted-foreground">
                                                                ({mentor.total_reviews})
                                                            </span>
                                                        </div>
                                                    )}

                                                    {mentor.mentorship_topics && mentor.mentorship_topics.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {mentor.mentorship_topics.slice(0, 2).map((topic, index) => (
                                                                <Badge key={index} variant="secondary" className="text-xs">
                                                                    {topic}
                                                                </Badge>
                                                            ))}
                                                            {mentor.mentorship_topics.length > 2 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{mentor.mentorship_topics.length - 2}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2 mt-4">
                                                        <Button size="sm" asChild className="flex-1">
                                                            <Link href={`/mentors/${mentor.slug || mentor.id}`}>
                                                                Ver Perfil
                                                            </Link>
                                                        </Button>
                                                        <Button size="sm" variant="outline">
                                                            <Heart className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="text-center py-8">
                                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Nenhum mentor encontrado</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Ainda não temos mentores verificados disponíveis.
                                    </p>
                                    <Button asChild>
                                        <Link href="/mentors">
                                            Ver Todos os Mentores
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </RequireRole>
    )
}
