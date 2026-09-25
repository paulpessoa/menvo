"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  Building2,
  TrendingUp,
  Mail,
  UserCheck
} from "lucide-react"
import Link from "next/link"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { PageContainer } from "@/components/layout/PageContainer"

interface AdminStats {
  totalUsers: number
  totalMentors: number
  verifiedMentors: number
  pendingMentors: number
  totalMentees: number
  totalSessions: number
  recentSignups: number
  pendingSuggestions: number
}

export default function AdminDashboard() {
  const t = useTranslations("admin")
  const { user, profile } = useAuth()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalMentors: 0,
    verifiedMentors: 0,
    pendingMentors: 0,
    totalMentees: 0,
    totalSessions: 0,
    recentSignups: 0,
    pendingSuggestions: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchStats()
    }
  }, [user?.id])

  // Same endpoint (/api/admin/stats) the "Aguardando" tab in
  // /dashboard/admin/users and the queue in /dashboard/admin/verifications
  // are built from — one query per number, no ad hoc counting here, so the
  // card and what you find after clicking "Acessar" always agree.
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      if (!response.ok) throw new Error("Erro ao carregar estatísticas")
      const data = await response.json()
      setStats({ ...data, pendingSuggestions: 0 })
    } catch (error) {
      console.error("Error fetching admin stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: "Verificação de Mentores",
      description: "Fila de candidaturas pendentes, com rascunho de resposta por IA",
      href: "/dashboard/admin/verifications",
      icon: UserCheck,
      color: "bg-yellow-600",
      badge: stats.pendingMentors > 0 ? stats.pendingMentors : undefined
    },
    {
      title: "Gestão de Usuários",
      description: "Gerenciar todos os usuários, permissões e papéis",
      href: "/dashboard/admin/users",
      icon: Users,
      color: "bg-primary"
    },
    {
      title: "Relatórios & IA",
      description: "Ver métricas de crescimento e buscas da IA",
      href: "/dashboard/admin/reports",
      icon: TrendingUp,
      color: "bg-green-600"
    },
    {
      title: "Custos de IA",
      description: "Custo por funcionalidade, modelo e usuário no mês",
      href: "/dashboard/admin/ai-usage",
      icon: TrendingUp,
      color: "bg-amber-600"
    },
    {
      title: "Feature Flags",
      description: "Ligar/Desligar funcionalidades em tempo real (Governança)",
      href: "/dashboard/admin/feature-flags",
      icon: Shield,
      color: "bg-purple-600"
    },
    {
      title: "E-mails Transacionais",
      description: "Visualizar templates Brevo, assinatura e botões Deep Teal",
      href: "/dashboard/admin/emails",
      icon: Mail,
      color: "bg-teal-600"
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <RequireRole roles={["admin"]}>
      <PageContainer>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">
              {t("welcome", { name: profile?.full_name || "Admin" })}
            </h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("stats.totalUsers")}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {t("stats.recentSignups", { count: stats.recentSignups })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("stats.verifiedMentors")}
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.verifiedMentors}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("stats.totalMentors", { count: stats.totalMentors })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("stats.pendingMentors")}
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pendingMentors}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("stats.awaitingVerification")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("stats.totalSessions")}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSessions}</div>
                <p className="text-xs text-muted-foreground">
                  {t("stats.sessionsDesc")}
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6">
              {t("actions.title")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      {action.badge && (
                        <Badge variant="destructive" className="animate-pulse">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg mt-4">
                      {action.title}
                    </CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href={action.href}>{t("actions.access")}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {stats.pendingMentors > 0 && (
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <CardTitle className="text-yellow-800 text-lg">
                    Aprovação de Mentores
                  </CardTitle>
                </div>
                <CardDescription className="text-yellow-700">
                  Existem {stats.pendingMentors} perfis aguardando sua validação
                  para aparecerem na busca.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  variant="outline"
                  className="bg-white border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                >
                  <Link href="/dashboard/admin/verifications">
                    Revisar Pendências
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </PageContainer>
    </RequireRole>
  )
}
