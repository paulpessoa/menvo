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
  TrendingUp
} from "lucide-react"
import Link from "next/link"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/utils/supabase/client"
import { useTranslations } from "next-intl"

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
  const supabase = createClient()

  useEffect(() => {
    if (user?.id && supabase) {
      fetchStats()
    } else if (!supabase) {
      setLoading(false)
    }
  }, [user?.id, supabase])

  const fetchStats = async () => {
    if (!supabase) return
    try {
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })

      const { data: mentorRoles, error: mentorError } = await (supabase
        .from("user_roles")
        .select(
          `
          profiles!inner(id, verified),
          roles!inner(name)
        `
        )
        .eq("roles.name", "mentor") as any)

      if (mentorError) throw mentorError

      const totalMentors = mentorRoles?.length || 0
      const verifiedMentors =
        mentorRoles?.filter((role: any) => {
          const profile = Array.isArray(role.profiles)
            ? role.profiles[0]
            : role.profiles
          return profile?.verified
        }).length || 0
      const pendingMentorsCount = totalMentors - verifiedMentors

      const { count: totalMentees } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("roles.name", "mentee")

      const { count: totalSessions } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: recentSignups } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString())

      setStats({
        totalUsers: totalUsers || 0,
        totalMentors,
        verifiedMentors,
        pendingMentors: pendingMentorsCount,
        totalMentees: totalMentees || 0,
        totalSessions: totalSessions || 0,
        recentSignups: recentSignups || 0,
        pendingSuggestions: 0
      })
    } catch (error) {
      console.error("Error fetching admin stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: "Gestão de Usuários",
      description: "Gerenciar todos os usuários, permissões e aprovar mentores",
      href: "/dashboard/admin/users",
      icon: Users,
      color: "bg-primary",
      badge: stats.pendingMentors > 0 ? stats.pendingMentors : undefined
    },
    {
      title: "Organizações",
      description: "Gerenciar parceiros e organizações do ecossistema",
      href: "/dashboard/admin/organizations",
      icon: Building2,
      color: "bg-blue-600"
    },
    {
      title: "Relatórios & IA",
      description: "Ver métricas de crescimento e buscas da IA",
      href: "/dashboard/admin/reports",
      icon: TrendingUp,
      color: "bg-green-600"
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
      <div className="container mx-auto px-4 py-8">
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
                  <Link href="/dashboard/admin/users?tab=pending">
                    Revisar Pendências
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </RequireRole>
  )
}
