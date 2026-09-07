"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Users,
  Settings,
  Clock,
  AlertTriangle,
  TrendingUp,
  Star,
  LayoutDashboard,
  Sparkles
} from "lucide-react"
import { Link } from "@/i18n/routing"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"
import { useTranslations, useLocale } from "next-intl"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FeedbackManagement } from "@/components/FeedbackManagement"
import { MentorUpcomingSessions, type MentorAppointment } from "@/components/dashboard/MentorUpcomingSessions"
import { mentorshipService } from "@/lib/services/mentorship/mentorship.service"

interface MentorStats {
  totalAppointments: number
  upcomingAppointments: number
  pendingRequests: number
  completedSessions: number
  totalMentees: number
  averageRating: number
  totalReviews: number
}

/**
 * Dashboard do Mentor — Menvo
 * Focado no core loop: Próximas sessões com Google Meet, alertas de solicitações pendentes,
 * atalho rápido para disponibilidade (45 min) e avaliações recebidas.
 */
export default function MentorDashboard() {
  const t = useTranslations("dashboard")
  const locale = useLocale()
  const { user, profile } = useAuth()
  const [stats, setStats] = useState<MentorStats>({
    totalAppointments: 0,
    upcomingAppointments: 0,
    pendingRequests: 0,
    completedSessions: 0,
    totalMentees: 0,
    averageRating: 0,
    totalReviews: 0
  })
  const [upcomingAppointments, setUpcomingAppointments] = useState<MentorAppointment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const [statsData, upcoming] = await Promise.all([
        mentorshipService.getMentorDashboardStats(user.id),
        mentorshipService.getMentorUpcomingAppointments(user.id, 5)
      ])

      setStats({
        ...statsData,
        averageRating: (profile as any)?.average_rating || 0,
        totalReviews: (profile as any)?.total_reviews || 0
      })
      setUpcomingAppointments(upcoming)
    } catch (error) {
      console.error("Error fetching mentor dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) fetchDashboardData()
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
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                {getGreeting()}, {profile?.first_name || "Mentor"}!
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">{t("mentor.welcome")}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm" className="rounded-xl font-semibold h-10 px-4">
                <Link href="/profile">
                  <Settings className="h-4 w-4 mr-2" /> {t("mentor.actions.editProfile")}
                </Link>
              </Button>
              <Button asChild size="sm" className="rounded-xl font-bold h-10 px-5 bg-primary hover:bg-primary/90 text-white shadow-xs">
                <Link href="/dashboard/mentor/availability">
                  <Clock className="h-4 w-4 mr-2" /> Agenda (45 min)
                </Link>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-8">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" /> Visão Geral
              </TabsTrigger>
              <TabsTrigger
                value="feedbacks"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base flex items-center gap-2"
              >
                <Star className="w-4 h-4" /> Avaliações
                {stats.totalReviews > 0 && (
                  <Badge variant="secondary" className="ml-1.5 font-bold">
                    {stats.totalReviews}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* TAB: VISÃO GERAL */}
            <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
              
              {/* Alerta de Solicitações Pendentes */}
              {stats.pendingRequests > 0 && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Você tem {stats.pendingRequests} {stats.pendingRequests === 1 ? "solicitação de mentoria aguardando sua confirmação" : "solicitações de mentoria aguardando sua confirmação"}!
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ao confirmar, o link do Google Meet é sincronizado automaticamente para ambos.
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shrink-0 shadow-xs">
                    <Link href="/mentorship/mentor">
                      Revisar Solicitações
                    </Link>
                  </Button>
                </div>
              )}

              {/* Cards de Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Próximas Sessões"
                  value={stats.upcomingAppointments}
                  icon={<Calendar className="h-5 w-5" />}
                  description="Agendamentos ativos"
                />
                <StatCard
                  title="Alunos Únicos"
                  value={stats.totalMentees}
                  icon={<Users className="h-5 w-5" />}
                  description="Mentees atendidos"
                />
                <StatCard
                  title="Concluídas"
                  value={stats.completedSessions}
                  icon={<TrendingUp className="h-5 w-5" />}
                  description="Mentorias realizadas"
                />
                <StatCard
                  title="Avaliação Média"
                  value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}
                  icon={<Star className="h-5 w-5 text-amber-500 fill-amber-500" />}
                  description={`${stats.totalReviews} avaliações`}
                />
              </div>

              {/* Grid Principal */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna Esquerda: Próximas Sessões + Ações Rápidas */}
                <div className="lg:col-span-2 space-y-6">
                  <MentorUpcomingSessions
                    appointments={upcomingAppointments}
                    loading={loading}
                    locale={locale}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <QuickActionCard
                      title="Minhas Mentorias"
                      desc="Histórico completo de sessões pendentes, confirmadas e avaliadas."
                      link="/mentorship/mentor"
                      icon={<Clock className="w-6 h-6 text-primary" />}
                    />
                    <QuickActionCard
                      title="Meu Perfil Público"
                      desc="Veja sua página pública exatamente como os mentorados a veem."
                      link={`/mentors/${profile?.slug || profile?.id}`}
                      icon={<Users className="w-6 h-6 text-primary" />}
                    />
                  </div>
                </div>

                {/* Coluna Direita: Disponibilidade + Status do Perfil + Dica */}
                <div className="space-y-6">
                  {/* Banner de Disponibilidade */}
                  <Card className="border-none shadow-sm bg-gradient-to-r from-primary-700 via-primary-600 to-primary text-white overflow-hidden relative rounded-2xl">
                    <CardHeader className="relative z-10 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-white/80 uppercase tracking-wider mb-1">
                        <Clock className="w-3.5 h-3.5" /> Sessões de 45 Minutos
                      </div>
                      <CardTitle className="text-xl font-bold text-white">Disponibilidade</CardTitle>
                      <p className="text-white/90 text-xs leading-relaxed mt-1">
                        Configure os dias e blocos de horário para mentorias voluntárias de 45 minutos.
                      </p>
                    </CardHeader>
                    <CardContent className="relative z-10 pt-2">
                      <Button asChild size="sm" className="bg-white text-primary hover:bg-white/95 font-bold shadow-md rounded-xl w-full">
                        <Link href="/dashboard/mentor/availability">Configurar Agenda</Link>
                      </Button>
                    </CardContent>
                    <Calendar className="absolute -bottom-4 -right-4 h-28 w-28 text-white/10 rotate-12 pointer-events-none" />
                  </Card>

                  {/* Perfil em Análise (se não verificado) */}
                  {profile && !profile.verified && (
                    <Card className="bg-amber-50/70 border-amber-200 rounded-2xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-amber-800 text-sm font-bold flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" /> Perfil em Verificação
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          Sua conta de mentor voluntário está sendo analisada pela equipe Menvo para garantir a qualidade e segurança da comunidade.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Card Boas Práticas */}
                  <Card className="rounded-2xl border border-gray-100 shadow-xs bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-900">
                        <Sparkles className="h-4 w-4 text-primary" /> Dica de Mentoria (45 min)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Dedique os primeiros <strong>5 minutos</strong> da chamada para alinhar a expectativa do aluno. Sessões objetivas de 45 minutos geram até <strong>2x mais impacto</strong> e foco.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* TAB: AVALIAÇÕES RECEBIDAS */}
            <TabsContent value="feedbacks" className="animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Avaliações Recebidas</h2>
                  <p className="text-muted-foreground text-sm">
                    Depoimentos e notas deixados pelos seus mentorados após a conclusão das sessões.
                  </p>
                </div>
                <FeedbackManagement type="received" />
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
        <div className="text-3xl font-black text-gray-900">{value}</div>
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
          <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-primary/10 transition-colors shrink-0">{icon}</div>
          <div>
            <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
