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
  LayoutDashboard
} from "lucide-react"
import Link from "next/link"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"
import { createClient } from "@/lib/utils/supabase/client"
import { useLocale, useTranslations } from "next-intl"
import { useFavorites } from "@/hooks/useFavorites"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FeedbackManagement } from "@/components/dashboard/FeedbackManagement"

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

  const supabase = createClient()
  const { favorites } = useFavorites(user?.id)

  const fetchMenteeStats = async () => {
    if (!user?.id) return
    try {
      const { data: appointments } = await supabase
        .from("appointments")
        .select("id, status, scheduled_at, duration_minutes, mentor_id")
        .eq("mentee_id", user.id)
      
      const apts = (appointments as any[]) || []
      const now = new Date()
      const upcoming = apts.filter(a => new Date(a.scheduled_at) > now && a.status !== "cancelled").length
      const completed = apts.filter(a => a.status === "completed").length
      const totalMinutes = apts.filter(a => a.status === "completed").reduce((sum, a) => sum + (a.duration_minutes || 0), 0)
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10
      const uniqueMentors = new Set(apts.map(a => a.mentor_id)).size

      setStats({
        totalAppointments: apts.length,
        upcomingAppointments: upcoming,
        completedSessions: completed,
        totalMentors: uniqueMentors,
        totalHours
      })
    } catch (error) {
      console.error("Error fetching mentee stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUpcomingAppointments = async () => {
    if (!user?.id) return
    try {
      const { data } = await supabase
        .from("appointments")
        .select(`
            id,
            scheduled_at,
            duration_minutes,
            status,
            mentor:profiles!mentor_id (
                full_name,
                avatar_url,
                job_title
            )
        `)
        .eq("mentee_id", user.id)
        .gte("scheduled_at", new Date().toISOString())
        .neq("status", "cancelled")
        .order("scheduled_at", { ascending: true })
        .limit(3)

      const formatted = (data as any[])?.map((apt: any) => {
          return {
            id: apt.id,
            scheduled_at: apt.scheduled_at,
            duration_minutes: apt.duration_minutes,
            status: apt.status,
            mentor: {
              full_name: apt.mentor?.full_name || "Mentor",
              avatar_url: apt.mentor?.avatar_url || null,
              job_title: apt.mentor?.job_title || null
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
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, job_title, company, average_rating, slug")
        .in("id", favorites)
        .limit(4)

      setFavoriteMentorsData((data as any[]) || [])
    } catch (error) {
      console.error("Error fetching favorite mentors details:", error)
    } finally {
      setLoadingFavorites(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchMenteeStats()
      fetchUpcomingAppointments()
    }
  }, [user?.id, profile])

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
              <h1 className="text-4xl font-black tracking-tight">{getGreeting()}, {profile?.first_name || "Mentorado"}!</h1>
              <p className="text-muted-foreground text-lg">{t("mentee.welcome")}</p>
            </div>
            <Button asChild className="rounded-full px-6">
              <Link href="/mentors">
                <Search className="h-4 w-4 mr-2" /> Buscar Mentores
              </Link>
            </Button>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-8">
              <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> Visão Geral
              </TabsTrigger>
              <TabsTrigger value="feedbacks" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Minhas Avaliações
              </TabsTrigger>
            </TabsList>

            {/* TAB: OVERVIEW */}
            <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Agendados" value={stats.upcomingAppointments} icon={<Calendar className="h-5 w-5" />} description="Próximas sessões" />
                <StatCard title="Mentores" value={stats.totalMentors} icon={<Users className="h-5 w-5" />} description="Mentores diferentes" />
                <StatCard title="Concluídas" value={stats.completedSessions} icon={<CheckCircle className="h-5 w-5 text-green-500" />} description="Total de sessões" />
                <StatCard title="Horas" value={`${stats.totalHours}h`} icon={<Clock className="h-5 w-5 text-blue-500" />} description="Tempo em mentoria" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <QuickActionCard 
                      title="Minhas Mentorias" 
                      desc="Acesse o histórico e detalhes das suas sessões." 
                      link="/mentorship/mentee" 
                      icon={<Calendar className="w-6 h-6 text-green-500" />}
                    />
                    <QuickActionCard 
                      title="Explorar Mentores" 
                      desc="Encontre novos profissionais para te ajudar." 
                      link="/mentors" 
                      icon={<Search className="w-6 h-6 text-blue-500" />}
                    />
                  </div>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Heart className="h-5 w-5 text-red-500 fill-current" /> Seus Favoritos
                        </CardTitle>
                        <CardDescription>Acesso rápido aos seus mentores preferidos.</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/mentors">Ver Todos</Link>
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {loadingFavorites ? <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : favoriteMentorsData.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground text-sm italic">Você ainda não favoritou nenhum mentor.</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {favoriteMentorsData.map((m) => (
                            <Link key={m.id} href={`/mentors/${m.slug || m.id}`}>
                              <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all">
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
                  <h2 className="text-2xl font-bold">Próximas Sessões</h2>
                  {upcomingAppointments.length === 0 ? (
                    <Card className="bg-gray-50/50 border-dashed">
                      <CardContent className="py-8 text-center">
                        <Calendar className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <p className="text-sm text-muted-foreground italic">Nenhuma sessão agendada.</p>
                        <Button asChild variant="link" className="mt-2 text-primary font-bold">
                          <Link href="/mentors">Agendar Agora</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {upcomingAppointments.map((appt) => (
                        <Card key={appt.id} className="border-l-4 border-l-primary overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar className="h-10 w-10 border">
                                <AvatarImage src={appt.mentor.avatar_url || undefined} />
                                <AvatarFallback>{appt.mentor.full_name[0]}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{appt.mentor.full_name}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {new Date(appt.scheduled_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                            <Button asChild size="sm" variant="secondary" className="w-full font-bold">
                              <Link href="/mentorship/mentee">Ver Detalhes</Link>
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
                  <h2 className="text-2xl font-bold">Avaliações Enviadas</h2>
                  <p className="text-muted-foreground">Gerencie os depoimentos que você deixou para seus mentores.</p>
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
    <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</CardTitle>
        <div className="p-2 bg-primary/5 rounded-lg text-primary">{icon}</div>
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
      <Card className="hover:border-primary/50 transition-all cursor-pointer h-full border-gray-100 shadow-sm hover:shadow-md group">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-primary/10 transition-colors">{icon}</div>
          <div>
            <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-gray-500 leading-tight mt-1">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
