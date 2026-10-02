"use client"

import { MenvoDots } from "@/components/ui/menvo-loader"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Users, Search, Clock, CheckCircle, Heart, MessageSquare, TrendingUp, LayoutDashboard, Video, ExternalLink, Shield, Star } from "lucide-react"
import { Link } from "@/i18n/routing"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"
import { useLocale, useTranslations } from "next-intl"
import { useFavorites } from "@/hooks/useFavorites"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FeedbackManagement } from "@/components/FeedbackManagement"
import { MenteeQuizCTA } from "@/components/MenteeQuizCTA"
import { MenteeNextStepCard } from "@/components/dashboard/MenteeNextStepCard"
import { MenteeActivationChecklist } from "@/components/dashboard/MenteeActivationChecklist"
import { useDiagnosticHref } from "@/hooks/useDiagnosticHref"
import { quizService } from "@/lib/services/quiz/quiz.service"
import { mentorshipService } from "@/lib/services/mentorship/mentorship.service"
import { mentorService } from "@/lib/services/mentors/mentors.service"
import type { QuizResponseSummary } from "@/lib/types/models/quiz"
import { useOnboarding } from "@/hooks/useOnboarding"

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
  google_meet_link?: string | null
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
  const diagnosticHref = useDiagnosticHref()
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
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">{getGreeting()}, {profile?.first_name || t("mentee.defaultName")}!</h1>
              <p className="text-muted-foreground text-base md:text-lg">{t("mentee.welcome")}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="rounded-xl font-medium text-muted-foreground hover:text-foreground">
                <Link href="/support">
                  <Shield className="h-4 w-4 mr-2" /> Suporte
                </Link>
              </Button>
            </div>
          </div>

          <Suspense fallback={<div className="py-10 flex justify-center"><MenvoDots /></div>}>
            <MenteeDashboardTabs 
              stats={stats} 
              upcomingAppointments={upcomingAppointments} 
              favoriteMentorsData={favoriteMentorsData} 
              loading={loading} 
              loadingFavorites={loadingFavorites} 
              loadingQuiz={loadingQuiz} 
              quizSummary={quizSummary} 
              hasPendingReview={hasPendingReview} 
              diagnosticHref={diagnosticHref} 
              locale={locale} 
              profile={profile}
            />
            <MenteeDashboardTour />
          </Suspense>
        </div>
      </div>
    </RequireRole>
  )
}

function MenteeDashboardTabs({ 
  stats, upcomingAppointments, favoriteMentorsData, loading, loadingFavorites, loadingQuiz, quizSummary, hasPendingReview, diagnosticHref, locale, profile
}: any) {
  const t = useTranslations("dashboard")
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "overview"

  return (
    <Tabs defaultValue={defaultTab} className="space-y-6">
      <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-6 sm:gap-8 overflow-x-auto hide-scrollbar flex-nowrap">
        <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base flex items-center gap-2 whitespace-nowrap">
          <LayoutDashboard className="w-4 h-4" /> {t("mentee.tabs.overview")}
        </TabsTrigger>
        <TabsTrigger value="favorites" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base flex items-center gap-2 whitespace-nowrap">
          <Heart className="w-4 h-4" /> {t("mentee.sections.favorites")}
        </TabsTrigger>
        <TabsTrigger value="feedbacks" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base flex items-center gap-2 whitespace-nowrap">
          <Star className="w-4 h-4" /> {t("mentee.tabs.feedbacks")}
        </TabsTrigger>
      </TabsList>

      {/* TAB: OVERVIEW */}
      <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
        {!(loading || loadingQuiz) && (
          <MenteeNextStepCard
            hasPendingReview={hasPendingReview}
            nextSession={upcomingAppointments[0] || null}
            quizDone={Boolean(quizSummary)}
            diagnosticHref={diagnosticHref}
          />
        )}

        <MenteeQuizCTA quizResponse={quizSummary} loading={loadingQuiz} />

        <MenteeActivationChecklist profile={profile} stats={stats} hasDiagnostic={Boolean(quizSummary)} />

        {/* Barra de Métricas Compacta */}
        <div className="flex flex-wrap items-center gap-4 text-sm bg-muted/30 rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-2 font-medium">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t("mentee.stats.scheduled")}:</span>
            <span className="text-foreground">{stats.upcomingAppointments}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-border" />
          <div className="flex items-center gap-2 font-medium">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t("mentee.stats.mentors")}:</span>
            <span className="text-foreground">{stats.totalMentors}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-border" />
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-muted-foreground">{t("mentee.stats.completed")}:</span>
            <span className="text-foreground">{stats.completedSessions}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-border" />
          <div className="flex items-center gap-2 font-medium">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">{t("mentee.stats.hours")}:</span>
            <span className="text-foreground">{stats.totalHours}h</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="rounded-xl font-medium text-muted-foreground hover:text-foreground">
            <Link href="/mentorship/mentee">Ver todas as sessões e histórico →</Link>
          </Button>
        </div>

      </TabsContent>

      {/* TAB: FAVORITES */}
      <TabsContent value="favorites" className="animate-in fade-in duration-500">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{t("mentee.sections.favorites")}</h2>
            <p className="text-muted-foreground text-sm">Mentores que você salvou para contatar no futuro.</p>
          </div>
          {loadingFavorites ? (
            <div className="flex justify-center py-12"><MenvoDots /></div>
          ) : favoriteMentorsData.length === 0 ? (
            <Card className="rounded-2xl border-border/60 shadow-none">
              <CardContent className="py-12 flex flex-col items-center text-center gap-4">
                <Heart className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t("mentee.sections.noFavorites")}</p>
                <Button asChild size="sm" className="rounded-xl">
                  <Link href="/mentors">{t("mentee.sections.exploreMentors")}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteMentorsData.filter((m: any) => m.slug || m.id).map((m: any) => (
                <Link key={m.id} href={`/mentors/${m.slug || m.id}`}>
                  <Card className="rounded-2xl border-border/60 shadow-none hover:border-primary/30 transition-colors">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Avatar className="h-12 w-12 border">
                        <AvatarImage src={m.avatar_url || undefined} />
                        <AvatarFallback>{m.full_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{m.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.job_title}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      {/* TAB: FEEDBACKS */}
      <TabsContent value="feedbacks" className="animate-in fade-in duration-500">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{t("mentee.tabs.feedbacks")}</h2>
            <p className="text-muted-foreground text-sm">Avaliações que você deixou para seus mentores após as sessões.</p>
          </div>
          <FeedbackManagement type="sent" />
        </div>
      </TabsContent>
    </Tabs>
  )
}

function MenteeDashboardTour() {
  const t = useTranslations("dashboard.mentee.tour")
  
  // O uso das strings fallback assegura funcionamento enquanto os t() não existirem
  const steps = [
    { popover: { title: "👋 Bem-vindo(a) à Menvo!", description: "Você acabou de dar o primeiro passo. Vamos fazer um tour rápido para você aproveitar tudo que a plataforma oferece." } },
    { element: "#tour-next-session", popover: { title: "Seu próximo passo", description: "Aqui a Menvo sempre vai destacar a sua prioridade do momento. Siga o fluxo para avançar na sua jornada." } },
    { element: "#tour-nav-mentors", popover: { title: "Encontre seu mentor", description: "Aqui você encontra todos os mentores verificados. Pode filtrar por área, skills, idioma e mais." } },
    { element: "#tour-nav-assistant", popover: { title: "Seu copiloto de carreira", description: "Converse com a IA da Menvo para tirar dúvidas, receber recomendações de mentores ou fazer o diagnóstico interativo." } },
    { element: "#tour-nav-profile-menu", popover: { title: "Complete seu perfil", description: "Quanto mais completo seu perfil, mais chances os mentores têm de aceitar seu pedido. Adicione foto, bio, LinkedIn e seus objetivos." } },
    { popover: { title: "🚀 Tudo pronto!", description: "Recomendamos começar pelo diagnóstico de carreira ou completar as missões da jornada. Boa sorte!" } }
  ]

  useOnboarding("ob_m1", steps)

  return null
}

