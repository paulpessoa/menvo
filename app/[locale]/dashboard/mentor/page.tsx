"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
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
  Sparkles,
  Shield
} from "lucide-react"
import { Link } from "@/i18n/routing"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"
import { useTranslations, useLocale } from "next-intl"
import { useOnboarding } from "@/hooks/useOnboarding"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FeedbackManagement } from "@/components/FeedbackManagement"
import { MentorUpcomingSessions, type MentorAppointment } from "@/components/dashboard/MentorUpcomingSessions"
import { MentorActivationChecklist } from "@/components/dashboard/MentorActivationChecklist"
import { mentorshipService } from "@/lib/services/mentorship/mentorship.service"
import { SharedDiagnosticsSection } from "@/components/diagnostic/SharedDiagnosticsSection"

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
 * Dashboard do Mentor - Menvo
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

      setStats(statsData)
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
      <div className="container mx-auto px-4 py-8">
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
              <Button asChild variant="ghost" size="sm" className="rounded-xl font-medium text-muted-foreground hover:text-foreground hidden sm:flex">
                <Link href="/support">
                  <Shield className="h-4 w-4 mr-2" /> Suporte
                </Link>
              </Button>
              <Button asChild size="sm" className="rounded-xl font-bold h-10 px-5 bg-primary hover:bg-primary/90 text-white shadow-xs">
                <Link href="/dashboard/mentor/availability">
                  <Clock className="h-4 w-4 mr-2" /> {t("mentor.actions.availability")}
                </Link>
              </Button>
            </div>
          </div>

          <Suspense>
            <MentorDashboardTabs stats={stats} profile={profile as any} upcomingAppointments={upcomingAppointments} loading={loading} locale={locale} />
            <MentorDashboardTour />
          </Suspense>
        </div>
      </div>
    </RequireRole>
  )
}

function MentorDashboardTabs({ stats, profile, upcomingAppointments, loading, locale }: { stats: MentorStats, profile: any, upcomingAppointments: MentorAppointment[], loading: boolean, locale: string }) {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "overview"

  return (
    <Tabs defaultValue={defaultTab} className="space-y-6">
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
              <TabsTrigger
                value="diagnostics"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-primary" /> Diagnósticos Compartilhados
              </TabsTrigger>
            </TabsList>

            {/* TAB: VISÃO GERAL */}
            <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">

              {/* Checklist de ativação: some sozinho quando tudo estiver pronto */}
              <MentorActivationChecklist profile={profile as any} stats={stats} />

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
                    <Link href="/mentorship/mentor#action">
                      Revisar Solicitações
                    </Link>
                  </Button>
                </div>
              )}

              {/* Barra de Métricas Compacta */}
              <div className="flex flex-wrap items-center gap-4 text-sm bg-muted/30 rounded-2xl p-4 border border-border/50">
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-muted-foreground">Próximas:</span>
                  <span className="text-foreground">{stats.upcomingAppointments}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-border" />
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-muted-foreground">Alunos:</span>
                  <span className="text-foreground">{stats.totalMentees}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-border" />
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-muted-foreground">Concluídas:</span>
                  <span className="text-foreground">{stats.completedSessions}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-border" />
                <div className="flex items-center gap-2 font-medium">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="text-foreground">{stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "-"}</span>
                  <span className="text-muted-foreground text-xs font-normal">({stats.totalReviews} avaliações)</span>
                </div>
              </div>

              {/* Conteúdo Principal */}
              <div className="space-y-6 max-w-3xl">
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

                <MentorUpcomingSessions
                  appointments={upcomingAppointments}
                  loading={loading}
                  locale={locale}
                />
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

            {/* TAB: DIAGNÓSTICOS COMPARTILHADOS */}
            <TabsContent value="diagnostics" className="animate-in fade-in slide-in-from-left-4 duration-500">
              <SharedDiagnosticsSection />
            </TabsContent>
          </Tabs>
  )
}



function MentorDashboardTour() {
  const steps = [
    { popover: { title: "👋 Bem-vindo(a) à sua central!", description: "Vamos fazer um tour rápido para você aproveitar todas as ferramentas como Mentor." } },
    { element: "#tour-mentor-checklist", popover: { title: "Sua Jornada de Impacto", description: "Siga estas etapas para maximizar seu impacto e ajudar mais pessoas." } },
    { element: "#tour-nav-community", popover: { title: "Comunidade de Mentores", description: "Um espaço exclusivo para você. Interaja com outros mentores, responda dúvidas e participe de discussões na nossa comunidade." } },
    { element: "#tour-nav-assistant", popover: { title: "Assistente de Carreira", description: "Sim, você também pode usar a nossa IA! Tire dúvidas, peça ideias de dinâmicas para suas mentorias ou explore novos conceitos." } },
    { element: "#tour-nav-profile-menu", popover: { title: "Gerencie seu perfil", description: "Mantenha seu perfil atualizado. Um perfil completo atrai mentorados mais alinhados aos seus conhecimentos." } },
    { popover: { title: "🚀 Tudo pronto!", description: "Aproveite a plataforma para devolver à comunidade e transformar carreiras. Obrigado por doar seu tempo!" } }
  ]

  useOnboarding("ob_mentor_1", steps)

  return null
}
