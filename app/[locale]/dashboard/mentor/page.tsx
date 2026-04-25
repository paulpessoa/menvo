"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Calendar,
  Users,
  Settings,
  Clock,
  AlertTriangle,
  TrendingUp,
  Star,
  Heart,
  Loader2,
  Edit
} from "lucide-react"
import Link from "next/link"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"
import { createClient } from "@/lib/utils/supabase/client"
import { useTranslations, useLocale } from "next-intl"
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
  const locale = useLocale()
  const { user, profile, isVerified } = useAuth()
  const [stats, setStats] = useState<MentorStats>({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedSessions: 0,
    totalMentees: 0,
    averageRating: 0,
    totalReviews: 0
  })
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    Appointment[]
  >([])
  const [favoriteMentorsData, setFavoriteMentorsData] = useState<
    FavoriteMentor[]
  >([])
  const [loading, setLoading] = useState(true)
  const [loadingFavorites, setLoadingFavorites] = useState(false)

  const supabase = createClient()
  const { favorites } = useFavorites(user?.id)

  const fetchMentorStats = async () => {
    if (!user?.id) return
    try {
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("id, status, scheduled_at")
        .eq("mentor_id", user.id)

      if (appointmentsError) throw appointmentsError

      const apts = (appointments as any[]) || []
      const now = new Date()
      const upcoming = apts.filter(
        (a) => new Date(a.scheduled_at) > now && a.status !== "cancelled"
      ).length
      const completed = apts.filter((a) => a.status === "completed").length

      const { data: uniqueMentees } = await supabase
        .from("appointments")
        .select("mentee_id")
        .eq("mentor_id", user.id)
        .neq("status", "cancelled")

      const totalMentees = new Set(
        (uniqueMentees as any[])?.map((apt: any) => apt.mentee_id)
      ).size

      setStats({
        totalAppointments: apts.length,
        upcomingAppointments: upcoming,
        completedSessions: completed,
        totalMentees,
        averageRating: (profile as any)?.average_rating || 0,
        totalReviews: (profile as any)?.total_reviews || 0
      })
    } catch (error) {
      console.error("Error fetching mentor stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUpcomingAppointments = async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
            id,
            scheduled_at,
            duration_minutes,
            status,
            mentee:profiles!mentee_id (
                full_name,
                avatar_url
            )
        `
        )
        .eq("mentor_id", user.id)
        .gte("scheduled_at", new Date().toISOString())
        .neq("status", "cancelled")
        .order("scheduled_at", { ascending: true })
        .limit(3)

      if (error) throw error

      const formatted =
        (data as any[])?.map((apt: any) => {
          return {
            id: apt.id,
            scheduled_at: apt.scheduled_at,
            duration_minutes: apt.duration_minutes,
            status: apt.status,
            mentee: {
              full_name: apt.mentee?.full_name || "Mentee",
              avatar_url: apt.mentee?.avatar_url || null
            }
          }
        }) || []

      setUpcomingAppointments(formatted)
    } catch (error) {
      console.error("Error fetching upcoming appointments:", error)
    }
  }

  const fetchFavoriteMentorsDetails = async () => {
    if (!favorites.length) return
    setLoadingFavorites(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, avatar_url, job_title, company, average_rating, slug"
        )
        .in("id", favorites)
        .limit(4)

      if (error) throw error
      setFavoriteMentorsData((data as any[]) || [])
    } catch (error) {
      console.error("Error fetching favorites:", error)
    } finally {
      setLoadingFavorites(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchMentorStats()
      fetchUpcomingAppointments()
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id && favorites.length > 0) fetchFavoriteMentorsDetails()
    else setFavoriteMentorsData([])
  }, [user?.id, favorites])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t("greetings.morning")
    if (hour < 18) return t("greetings.afternoon")
    return t("greetings.evening")
  }

  return (
    <RequireRole roles={["mentor"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {profile && !profile.verified && (
            <Card className="border-yellow-200 bg-yellow-50 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-yellow-100 bg-yellow-100/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-yellow-900 text-lg">
                      {(profile as any).verification_status === "rejected"
                        ? "Ajustes Necessários"
                        : "Perfil em Análise"}
                    </CardTitle>
                    <CardDescription className="text-yellow-700">
                      {(profile as any).verification_status === "rejected"
                        ? "Revisamos seu perfil e solicitamos ajustes."
                        : "Seu perfil está em análise pela nossa equipe."}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              {(profile as any).verification_notes && (
                <CardContent className="pt-4">
                  <div className="bg-white p-4 rounded-lg border border-yellow-200 shadow-inner">
                    <p className="text-xs font-bold text-yellow-600 uppercase mb-2">
                      Mensagem do Admin:
                    </p>
                    <p className="text-sm text-gray-800 italic">
                      "{(profile as any).verification_notes}"
                    </p>
                  </div>
                  <Button
                    asChild
                    className="mt-4 bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Link href="/profile">
                      <Edit className="h-4 w-4 mr-2" /> Editar Perfil
                    </Link>
                  </Button>
                </CardContent>
              )}
            </Card>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">
                {getGreeting()}, {profile?.full_name || "Mentor"}!
              </h1>
              <p className="text-muted-foreground">{t("mentor.welcome")}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/profile">
                <Settings className="h-4 w-4 mr-2" />{" "}
                {t("mentor.actions.editProfile")}
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("mentor.stats.upcoming")}
                </CardTitle>
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
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("mentor.stats.mentees")}
                </CardTitle>
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
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("mentor.stats.completed")}
                </CardTitle>
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
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("mentor.stats.rating")}
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading
                    ? "..."
                    : stats.averageRating > 0
                      ? stats.averageRating.toFixed(1)
                      : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading
                    ? "..."
                    : t("mentor.stats.reviews", { count: stats.totalReviews })}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-semibold">
                {t("mentor.actions.title")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />{" "}
                      {t("mentor.actions.manageAgenda")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("mentor.actions.availabilityDesc")}
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={!isVerified}
                    >
                      <Link href="/dashboard/mentor/availability">
                        {t("mentor.actions.manageAgenda")}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-green-500" />{" "}
                      {t("mentor.actions.mentorships")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("mentor.actions.mentorshipsDesc")}
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={!isVerified}
                    >
                      <Link href="/mentorship/mentor">
                        {t("mentor.actions.viewMentorships")}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500 fill-current" />{" "}
                      {t("mentor.sections.favorites")}
                    </CardTitle>
                    <CardDescription>
                      {t("mentor.sections.favoritesDesc")}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/mentors">{t("mentor.sections.viewAll")}</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingFavorites ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : favoriteMentorsData.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm italic">
                      {t("mentee.sections.noFavorites")}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {favoriteMentorsData.map((m) => (
                        <Link key={m.id} href={`/mentors/${m.slug || m.id}`}>
                          <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={m.avatar_url || undefined} />
                              <AvatarFallback>{m.full_name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {m.full_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {m.job_title}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">
                {t("mentor.sections.upcoming")}
              </h2>
              {upcomingAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-sm text-muted-foreground">
                      {t("mentor.sections.noSessions")}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((appt) => (
                    <Card key={appt.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={appt.mentee.avatar_url || undefined}
                            />
                            <AvatarFallback>
                              {appt.mentee.full_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {appt.mentee.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(appt.scheduled_at).toLocaleDateString(
                                locale === "pt-BR" ? "pt-BR" : "en-US",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <Button
                          asChild
                          size="sm"
                          variant="secondary"
                          className="w-full"
                        >
                          <Link href="/mentorship/mentor">
                            {t("mentee.sections.viewDetails")}
                          </Link>
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
