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
  Edit,
  MessageSquare
} from "lucide-react"
import Link from "next/link"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"
import { createClient } from "@/lib/utils/supabase/client"
import { useTranslations, useLocale } from "next-intl"
import { useFavorites } from "@/hooks/useFavorites"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FeedbackManagement } from "@/components/dashboard/FeedbackManagement"

interface MentorStats {
  totalAppointments: number
  upcomingAppointments: number
  completedSessions: number
  totalMentees: number
  averageRating: number
  totalReviews: number
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
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchMentorStats = async () => {
    if (!user?.id) return
    try {
      const { data: appointments } = await supabase
        .from("appointments")
        .select("id, status, scheduled_at")
        .eq("mentor_id", user.id)

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

  useEffect(() => {
    if (user?.id) fetchMentorStats()
  }, [user?.id, profile])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t("greetings.morning")
    if (hour < 18) return t("greetings.afternoon")
    return t("greetings.evening")
  }

  return (
    <RequireRole roles={["mentor"]}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          
          {/* Header e Boas-vindas */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight">
                {getGreeting()}, {profile?.first_name || "Mentor"}!
              </h1>
              <p className="text-muted-foreground text-lg">{t("mentor.welcome")}</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-full px-5">
                <Link href="/profile">
                  <Settings className="h-4 w-4 mr-2" /> {t("mentor.actions.editProfile")}
                </Link>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-8">
              <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base">Visão Geral</TabsTrigger>
              <TabsTrigger value="feedbacks" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base">
                Avaliações <Badge variant="secondary" className="ml-2">{stats.totalReviews}</Badge>
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base">Configurações</TabsTrigger>
            </TabsList>

            {/* TAB: OVERVIEW */}
            <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Agendados" value={stats.upcomingAppointments} icon={<Calendar className="h-5 w-5" />} description="Próximas sessões" />
                <StatCard title="Mentorados" value={stats.totalMentees} icon={<Users className="h-5 w-5" />} description="Alunos únicos" />
                <StatCard title="Concluídas" value={stats.completedSessions} icon={<TrendingUp className="h-5 w-5" />} description="Total de sessões" />
                <StatCard title="Rating" value={stats.averageRating.toFixed(1)} icon={<Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />} description={`${stats.totalReviews} avaliações`} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                   <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden relative">
                      <CardHeader className="relative z-10">
                        <CardTitle className="text-2xl">Gerencie sua Agenda</CardTitle>
                        <CardDescription className="text-blue-100 text-base">Mantenha seus horários atualizados para receber novos agendamentos.</CardDescription>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-bold">
                          <Link href="/dashboard/mentor/availability">Configurar Disponibilidade</Link>
                        </Button>
                      </CardContent>
                      <Calendar className="absolute -bottom-4 -right-4 h-32 w-32 text-white/10 rotate-12" />
                   </Card>

                   <div className="flex items-center justify-between">
                     <h2 className="text-2xl font-bold">Próximos Passos</h2>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <QuickActionCard 
                        title="Ver Mentorias" 
                        desc="Gerencie suas solicitações e sessões ativas." 
                        link="/mentorship/mentor" 
                        icon={<Clock className="w-6 h-6 text-green-500" />}
                      />
                      <QuickActionCard 
                        title="Meu Perfil Público" 
                        desc="Veja como os alunos enxergam você." 
                        link={`/mentors/${profile?.slug || profile?.id}`} 
                        icon={<Users className="w-6 h-6 text-purple-500" />}
                      />
                   </div>
                </div>

                <div className="space-y-6">
                   <h2 className="text-2xl font-bold">Resumo</h2>
                   {profile && !profile.verified && (
                      <Card className="bg-amber-50 border-amber-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-amber-800 text-base flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Perfil em Análise
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-amber-700">Sua conta de mentor está sendo revisada. Você poderá aceitar mentorias assim que for aprovado.</p>
                        </CardContent>
                      </Card>
                   )}
                   
                   <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Dica do Staff</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Mentores que preenchem detalhadamente sua <strong>Abordagem de Mentoria</strong> recebem 3x mais solicitações.
                        </p>
                      </CardContent>
                   </Card>
                </div>
              </div>
            </TabsContent>

            {/* TAB: FEEDBACKS */}
            <TabsContent value="feedbacks" className="animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Avaliações Recebidas</h2>
                  <p className="text-muted-foreground">Depoimentos dos seus alunos após as sessões.</p>
                </div>
                <FeedbackManagement type="received" />
              </div>
            </TabsContent>

            {/* TAB: SETTINGS */}
            <TabsContent value="settings" className="animate-in fade-in slide-in-from-left-4 duration-500">
               <Card>
                 <CardHeader>
                   <CardTitle>Configurações da Conta</CardTitle>
                   <CardDescription>Gerencie suas preferências de notificação e privacidade.</CardDescription>
                 </CardHeader>
                 <CardContent className="h-40 flex items-center justify-center text-muted-foreground italic">
                   Em breve: Mais controles para sua conta.
                 </CardContent>
               </Card>
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
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full border-gray-100 shadow-sm">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="p-3 bg-gray-50 rounded-xl">{icon}</div>
          <div>
            <h3 className="font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 leading-tight mt-1">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
