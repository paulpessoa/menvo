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
import { useTranslations } from "next-intl"

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
    const t = useTranslations("dashboard")
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

            const totalMinutes = appointments?.filter(apt => apt.status === 'completed')
                .reduce((sum, apt) => sum + apt.duration_minutes, 0) || 0
            const totalHours = Math.round(totalMinutes / 60 * 10) / 10 

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
        if (hour < 12) return t("greetings.morning")
        if (hour < 18) return t("greetings.afternoon")
        return t("greetings.evening")
    }

    const quickActions = [
        {
            title: t("mentor.actions.mentorships"),
            description: t("mentee.actions.findDesc"),
            href: "/mentorship/mentee",
            icon: Calendar,
            color: "bg-green-500"
        },
        {
            title: t("mentee.actions.find"),
            description: t("mentee.actions.findDesc"),
            href: "/mentors",
            icon: Search,
            color: "bg-blue-500"
        },
        {
            title: t("mentor.actions.editProfile"),
            description: t("mentor.actions.editProfileDesc"),
            href: "/profile",
            icon: Users,
            color: "bg-purple-500"
        }
    ]

    return (
        <RequireRole roles={['mentee']}>
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold">
                            {getGreeting()}, {profile?.full_name || "Mentee"}!
                        </h1>
                        <p className="text-muted-foreground">
                            {t("mentee.welcome")}
                        </p>
                    </div>

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
                                <CardTitle className="text-sm font-medium">{t("mentee.stats.mentors")}</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? "..." : stats.totalMentors}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t("mentee.stats.mentorsDesc")}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t("mentor.stats.completed")}</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
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
                                <CardTitle className="text-sm font-medium">{t("mentee.stats.hours")}</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? "..." : stats.totalHours}h
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t("mentee.stats.hoursDesc")}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-6">{t("mentor.actions.title")}</h2>
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
                                                {t("mentor.actions.access")}
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                    <span className="text-sm text-muted-foreground">{t("gettingStarted.step3Mentee")}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                    <span className="text-sm text-muted-foreground">{t("gettingStarted.step4Mentee")}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                    <span className="text-sm text-muted-foreground">{t("gettingStarted.step5Mentee")}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t("mentee.progress.title")}</CardTitle>
                                <CardDescription>
                                    {t("mentee.progress.description")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-6 text-muted-foreground">
                                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-sm italic">{t("mentee.progress.inDevelopment")}</p>
                                    <p className="text-xs mt-2">
                                        {t("mentee.progress.comingSoon")}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </RequireRole>
    )
}
