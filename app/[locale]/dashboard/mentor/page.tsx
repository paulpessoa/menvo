"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Users, Settings, Clock, CheckCircle, AlertCircle, TrendingUp, Star, MessageCircle, Heart, Loader2 } from "lucide-react"
import Link from "next/link"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/client"
import { useTranslations } from "next-intl"
import { useFavorites } from "@/hooks/useFavorites"

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

interface FavoriteMentor {
    id: string
    full_name: string
    avatar_url: string | null
    job_title: string | null
    company: string | null
    average_rating: number
    slug: string | null
}

export default function MentorDashboard() {
    const t = useTranslations("dashboard")
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
    const [favoriteMentorsData, setFavoriteMentorsData] = useState<FavoriteMentor[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingFavorites, setLoadingFavorites] = useState(false)

    const supabase = createClient()
    const { favorites } = useFavorites(user?.id)

    useEffect(() => {
        if (user?.id) {
            fetchMentorStats()
            fetchUpcomingAppointments()
        }
    }, [user?.id])

    useEffect(() => {
        if (user?.id && favorites.length > 0) {
            fetchFavoriteMentorsDetails()
        } else {
            setFavoriteMentorsData([])
        }
    }, [user?.id, favorites])

    const fetchMentorStats = async () => {
        try {
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

    const fetchFavoriteMentorsDetails = async () => {
        setLoadingFavorites(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, job_title, company, average_rating, slug')
                .in('id', favorites)
                .limit(4)

            if (error) throw error
            setFavoriteMentorsData(data || [])
        } catch (error) {
            console.error('Error fetching favorite mentors details:', error)
        } finally {
            setLoadingFavorites(false)
        }
    }

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return t("greetings.morning")
        if (hour < 18) return t("greetings.afternoon")
        return t("greetings.evening")
    }

    return (
        <RequireRole roles={['mentor']}>
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold">
                            {getGreeting()}, {profile?.full_name || "Mentor"}!
                        </h1>
                        <p className="text-muted-foreground">
                            {t("mentor.welcome")}
                        </p>
                    </div>

                    <Card className={isVerified ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
                        <CardContent className="flex items-center gap-4 p-6">
                            {isVerified ? (
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            ) : (
                                <AlertCircle className="h-8 w-8 text-yellow-600" />
                            )}
                            <div className="flex-1">
                                <h3 className="font-semibold">
                                    {isVerified ? t("mentor.verification.approved") : t("mentor.verification.pending")}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {isVerified
                                        ? t("mentor.verification.approvedText")
                                        : t("mentor.verification.pendingText")
                                    }
                                </p>
                            </div>
                            <Badge variant={isVerified ? "default" : "secondary"}>
                                {isVerified ? t("mentor.verification.badgeApproved") : t("mentor.verification.badgePending")}
                            </Badge>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t("mentor.stats.upcoming")}</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? "..." : stats.upcomingAppointments}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t("mentor.stats.upcomingDesc")}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t("mentor.stats.mentees")}</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? "..." : stats.totalMentees}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t("mentor.stats.menteesDesc")}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t("mentor.stats.completed")}</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? "..." : stats.completedSessions}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t("mentor.stats.completedDesc")}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t("mentor.stats.rating")}</CardTitle>
                                <Star className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? "..." : stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {loading ? "..." : t("mentor.stats.reviews", { count: stats.totalReviews })}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Ações Rápidas */}
                        <div className="lg:col-span-2 space-y-6">
                            <h2 className="text-2xl font-semibold">{t("mentor.actions.title")}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Calendar className="h-5 w-5 text-blue-500" />
                                            Gerenciar Agenda
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-4">Defina seus horários e fuso horário de atendimento</p>
                                        <Button asChild variant="outline" size="sm" className="w-full" disabled={!isVerified}>
                                            <Link href="/dashboard/mentor/availability">Configurar Agenda</Link>
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-green-500" />
                                            Minhas Mentorias
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-4">Acompanhe seus agendamentos confirmados e pendentes</p>
                                        <Button asChild variant="outline" size="sm" className="w-full" disabled={!isVerified}>
                                            <Link href="/mentorship/mentor">Ver Mentorias</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Mentores Favoritos */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Heart className="h-5 w-5 text-red-500 fill-current" />
                                            Meus Mentores Favoritos
                                        </CardTitle>
                                        <CardDescription>Acesso rápido aos mentores que você salvou para se inspirar ou consultar</CardDescription>
                                    </div>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href="/mentors">Ver todos</Link>
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    {loadingFavorites ? (
                                        <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                                    ) : favoriteMentorsData.length === 0 ? (
                                        <div className="text-center py-4 text-muted-foreground text-sm italic">
                                            Você ainda não salvou nenhum mentor.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {favoriteMentorsData.map(mentor => (
                                                <Link key={mentor.id} href={`/mentors/${mentor.slug || mentor.id}`}>
                                                    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={mentor.avatar_url || undefined} />
                                                            <AvatarFallback>{mentor.full_name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium truncate">{mentor.full_name}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{mentor.job_title}</p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Coluna Direita: Próximas Mentorias */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold">Próximas Sessões</h2>
                            {upcomingAppointments.length === 0 ? (
                                <Card>
                                    <CardContent className="py-8 text-center">
                                        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                                        <p className="text-sm text-muted-foreground">Nenhuma sessão agendada.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-4">
                                    {upcomingAppointments.map(appt => (
                                        <Card key={appt.id}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={appt.mentee.avatar_url || undefined} />
                                                        <AvatarFallback>{appt.mentee.full_name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium">{appt.mentee.full_name}</p>
                                                        <p className="text-xs text-muted-foreground">{new Date(appt.scheduled_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                                    </div>
                                                </div>
                                                <Button asChild size="sm" variant="secondary" className="w-full">
                                                    <Link href="/mentorship/mentor">Ver Detalhes</Link>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </RequireRole>
    )
}
