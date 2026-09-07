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
  Search,
  Clock,
  CheckCircle,
  Heart,
  Loader2,
  MessageSquare,
  TrendingUp,
  LayoutDashboard,
  Star
} from "lucide-react"
import { Link } from "@/i18n/routing"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"
import { useLocale, useTranslations } from "next-intl"
import { useFavorites } from "@/hooks/useFavorites"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FeedbackManagement } from "@/components/dashboard/FeedbackManagement"
import { MenteeQuizCTA } from "@/components/dashboard/MenteeQuizCTA"
import { quizService } from "@/lib/services/quiz/quiz.service"
import { mentorshipService } from "@/lib/services/mentorship/mentorship.service"
import { mentorService } from "@/lib/services/mentors/mentors.service"
import type { QuizResponseSummary } from "@/lib/types/models/quiz"

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

interface FavoriteMentor {
  id: string
  full_name: string
  avatar_url: string | null
  job_title: string | null
  company: string | null
  average_rating: number
  slug: string | null
}

export default function MenteeDashboard() {
  const t = useTranslations("dashboard")
  const locale = useLocale()
  const { user, profile } = useAuth()
  const [stats, setStats] = useState<MenteeStats>({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedSessions: 0,
    totalMentors: 0,
    totalHours: 0
  })
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [favoriteMentorsData, setFavoriteMentorsData] = useState<FavoriteMentor[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingFavorites, setLoadingFavorites] = useState(false)
  const [quizSummary, setQuizSummary] = useState<QuizResponseSummary | null>(null)
  const [loadingQuiz, setLoadingQuiz] = useState(true)

  const [hasPendingReview, setHasPendingReview] = useState(false)
  const { favorites } = useFavorites(user?.id)

  const fetchMenteeStats = async () => {
    if (!user?.id) return
    try {
      const [statsData, pending] = await Promise.all([
        mentorshipService.getMenteeDashboardStats(user.id),
        mentorshipService.hasPendingEvaluations(user.id)
      ])
      setStats(statsData)
      setHasPendingReview(pending)
    } catch (error) {
      console.error("Error fetching mentee stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUpcomingAppointments = async () => {
    if (!user?.id) return
    try {
      const formatted = await mentorshipService.getMenteeUpcomingAppointments(user.id, 3)
      setUpcomingAppointments(formatted)
    } catch (error) {
      console.error("Error fetching upcoming appointments:", error)
    }
  }

  const fetchFavoriteMentorsDetails = async () => {
    if (!favorites.length) return
    setLoadingFavorites(true)
    try {
      const data = await mentorService.getFavoriteMentors(favorites)
      setFavoriteMentorsData(data)
    } catch (error) {
      console.error("Error fetching favorite mentors details:", error)
    } finally {
      setLoadingFavorites(false)
    }
  }

  const fetchQuizStatus = async () => {
    if (!user?.email) {
      setLoadingQuiz(false)
      return
    }
    try {
      const summary = await quizService.getLatestQuizResponseByEmail(user.email)
      setQuizSummary(summary)
    } catch (error) {
      console.error("Error checking mentee quiz status:", error)
    } finally {
      setLoadingQuiz(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchMenteeStats()
      fetchUpcomingAppointments()
      fetchQuizStatus()
    }
  }, [user?.id, user?.email, profile])

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
    <RequireRole roles={["mentee"]}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">{getGreeting()}, {profile?.first_name || t("mentee.defaultName")}!</h1>
              <p className="text-muted-foreground text-base md:text-lg">{t("mentee.welcome")}</p>
            </div>
            <Button asChild className="rounded-xl px-6 h-12 font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all">
              <Link href="/mentors">
                <Search className="h-4 w-4 mr-2" /> {t("mentee.actions.find")}
              </Link>
            </Button>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-8">
              <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> {t("mentee.tabs.overview")}
              </TabsTrigger>
              <TabsTrigger value="feedbacks" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> {t("mentee.tabs.feedbacks")}
              </TabsTrigger>
            </TabsList>

            {/* TAB: OVERVIEW */}
            <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
              {/* Lembrete de Avaliação Pendente */}
              {hasPendingReview && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                      <Star className="h-5 w-5 fill-current" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Você tem mentoria aguardando sua avaliação!
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sua opinião ajuda o mentor a evoluir e fortalece a comunidade voluntária da Menvo.
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shrink-0 shadow-sm">
                    <Link href="/mentorship/mentee">
                      Avaliar Agora
                    </Link>
                  </Button>
                </div>
              )}

              {/* Quiz Onboarding & Activation CTA */}
              <MenteeQuizCTA quizResponse={quizSummary} loading={loadingQuiz} />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t("mentee.stats.scheduled")} value={stats.upcomingAppointments} icon={<Calendar className="h-5 w-5" />} description={t("mentee.stats.scheduledDesc")} />
                <StatCard title={t("mentee.stats.mentors")} value={stats.totalMentors} icon={<Users className="h-5 w-5" />} description={t("mentee.stats.mentorsDesc")} />
                <StatCard title={t("mentee.stats.completed")} value={stats.completedSessions} icon={<CheckCircle className="h-5 w-5 text-green-500" />} description={t("mentee.stats.completedDesc")} />
                <StatCard title={t("mentee.stats.hours")} value={`${stats.totalHours}h`} icon={<Clock className="h-5 w-5 text-blue-500" />} description={t("mentee.stats.hoursDesc")} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <QuickActionCard 
                      title={t("mentee.actions.myMentorshipsAction")} 
                      desc={t("mentee.actions.myMentorshipsActionDesc")} 
                      link="/mentorship/mentee" 
                      icon={<Calendar className="w-6 h-6 text-green-500" />}
                    />
                    <QuickActionCard 
                      title={t("mentee.actions.exploreMentorsAction")} 
                      desc={t("mentee.actions.exploreMentorsActionDesc")} 
                      link="/mentors" 
                      icon={<Search className="w-6 h-6 text-blue-500" />}
                    />
                  </div>

                  <Card className="rounded-2xl border border-gray-100 shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                          <Heart className="h-5 w-5 text-red-500 fill-current" /> {t("mentee.sections.favorites")}
                        </CardTitle>
                        <CardDescription>{t("mentee.sections.favoritesDesc")}</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="rounded-xl font-medium">
                        <Link href="/mentors">{t("mentee.sections.viewAll")}</Link>
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {loadingFavorites ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                      ) : favoriteMentorsData.length === 0 ? (
                        <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-gray-200/80 bg-gradient-to-b from-gray-50/50 to-transparent flex flex-col items-center justify-center">
                          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3 shadow-xs">
                            <Heart className="h-6 w-6 text-red-400" />
                          </div>
                          <p className="font-semibold text-gray-900 text-sm mb-1">{t("mentee.sections.noFavorites")}</p>
                          <p className="text-xs text-muted-foreground max-w-xs mb-4">{t("mentee.sections.noFavoritesDesc")}</p>
                          <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-semibold hover:border-primary/40 hover:text-primary">
                            <Link href="/mentors">{t("mentee.sections.exploreMentors")}</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {favoriteMentorsData.map((m) => (
                            <Link key={m.id} href={`/mentors/${m.slug || m.id}`}>
                              <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all">
                                <Avatar className="h-12 w-12 border">
                                  <AvatarImage src={m.avatar_url || undefined} />
                                  <AvatarFallback>{m.full_name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold truncate">{m.full_name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{m.job_title}</p>
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
                  <h2 className="text-2xl font-bold">{t("mentee.sections.upcoming")}</h2>
                  {upcomingAppointments.length === 0 ? (
                    <Card className="bg-gradient-to-b from-gray-50/60 to-white/40 border border-dashed border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                      <CardContent className="py-10 px-6 text-center flex flex-col items-center justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-xs">
                          <Calendar className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-base mb-1">{t("mentee.sections.noAppointments")}</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mb-5 leading-relaxed">
                          {t("mentee.sections.noAppointmentsDesc")}
                        </p>
                        <Button asChild size="sm" className="rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all px-5 h-10">
                          <Link href="/mentors">{t("mentee.sections.bookNow")}</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {upcomingAppointments.map((appt) => (
                        <Card key={appt.id} className="border-l-4 border-l-primary overflow-hidden rounded-2xl shadow-xs hover:shadow-md transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar className="h-10 w-10 border">
                                <AvatarImage src={appt.mentor.avatar_url || undefined} />
                                <AvatarFallback>{appt.mentor.full_name[0]}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{appt.mentor.full_name}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {new Date(appt.scheduled_at).toLocaleString(locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                            <Button asChild size="sm" variant="secondary" className="w-full font-bold rounded-xl h-9">
                              <Link href="/mentorship/mentee">{t("mentee.sections.viewDetails")}</Link>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB: FEEDBACKS */}
            <TabsContent value="feedbacks" className="animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">{t("mentee.tabs.feedbacksTitle")}</h2>
                  <p className="text-muted-foreground">{t("mentee.tabs.feedbacksDesc")}</p>
                </div>
                <FeedbackManagement type="sent" />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RequireRole>
  )
}

function StatCard({ title, value, icon, description }: { title: string, value: any, icon: any, description: string }) {
  return (
    <Card className="rounded-2xl border border-gray-100 shadow-xs bg-white hover:shadow-md transition-all">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</CardTitle>
        <div className="p-2 bg-primary/5 rounded-xl text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

function QuickActionCard({ title, desc, link, icon }: { title: string, desc: string, link: string, icon: any }) {
  return (
    <Link href={link}>
      <Card className="rounded-2xl hover:border-primary/40 transition-all cursor-pointer h-full border-gray-100 shadow-xs hover:shadow-md group bg-white">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-primary/10 transition-colors">{icon}</div>
          <div>
            <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-gray-500 leading-tight mt-1">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
