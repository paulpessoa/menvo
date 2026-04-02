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
import { useTranslations } from "next-intl"

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

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return t("greetings.morning")
        if (hour < 18) return t("greetings.afternoon")
        return t("greetings.evening")
    }

    const quickActions = [
        {
            title: t("mentor.actions.availability"),
            description: t("mentor.actions.availabilityDesc"),
            href: "/dashboard/mentor/availability",
            icon: Calendar,
            color: "bg-blue-500",
            disabled: !isVerified
        },
        {
            title: t("mentor.actions.mentorships"),
            description: t("mentor.actions.mentorshipsDesc"),
            href: "/mentorship/mentor",
            icon: Clock,
            color: "bg-green-500",
            disabled: !isVerified
        },
        {
            title: t("mentor.actions.editProfile"),
            description: t("mentor.actions.editProfileDesc"),
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

                    <div>
                        <h2 className="text-2xl font-semibold mb-6">{t("mentor.actions.title")}</h2>
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
                                                    {t("mentor.actions.waitingVerification")}
                                                </span>
                                            ) : (
                                                <Link href={action.href}>
                                                    {t("mentor.actions.access")}
                                                </Link>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {!isVerified && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("gettingStarted.title")}</CardTitle>
                                <CardDescription>
                                    {t("gettingStarted.description")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="text-sm">{t("gettingStarted.step1")}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="text-sm">{t("gettingStarted.step2")}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                                    <span className="text-sm">{t("gettingStarted.step3Mentor")}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                    <span className="text-sm text-muted-foreground">{t("gettingStarted.step4Mentor")}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                    <span className="text-sm text-muted-foreground">{t("gettingStarted.step5Mentor")}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </RequireRole>
    )
}
