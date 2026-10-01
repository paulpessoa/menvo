"use client"

import { useState, useEffect } from "react"
import { PageContainer } from "@/components/layout/PageContainer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MenvoDots } from "@/components/ui/menvo-loader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Clock, AlertTriangle, ShieldCheck, Mail, CalendarX, UserMinus, Moon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface QueueRow {
  user_id: string
  campaign: string
  clock_started_at: string
  notice_30d_sent_at: string | null
  notice_1d_sent_at: string | null
  scheduled_deletion_at: string | null
  profile: {
    email: string
    full_name: string | null
    email_opt_out_at: string | null
  }
}

interface InactiveQueueRow {
  user_id: string
  last_sign_in_at: string
  notice_30d_sent_at: string | null
  scheduled_deletion_at: string | null
  profile: {
    email: string
    full_name: string | null
  }
}

interface RetentionStats {
  enrolled: number
  noticed30d: number
  noticed1d: number
  optedOut: number
}

interface InactiveStats {
  enrolled: number
  noticed30d: number
}

export default function RetentionAdminPage() {
  const [queue, setQueue] = useState<QueueRow[]>([])
  const [inactiveQueue, setInactiveQueue] = useState<InactiveQueueRow[]>([])
  const [stats, setStats] = useState<RetentionStats>({ enrolled: 0, noticed30d: 0, noticed1d: 0, optedOut: 0 })
  const [inactiveStats, setInactiveStats] = useState<InactiveStats>({ enrolled: 0, noticed30d: 0 })
  const [loading, setLoading] = useState(true)
  const [exempting, setExempting] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/retention")
      if (!res.ok) throw new Error("Falha ao buscar fila de retenção")
      const data = await res.json()
      setQueue(data.queue || [])
      setStats(data.stats)
      setInactiveQueue(data.inactiveQueue || [])
      if (data.inactiveStats) setInactiveStats(data.inactiveStats)
    } catch (error) {
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleExempt = async (userId: string) => {
    setExempting(userId)
    try {
      const res = await fetch("/api/admin/retention/exempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      })
      if (!res.ok) throw new Error("Erro ao isentar")
      toast.success("Usuário isentado da exclusão automática")
      await fetchData()
    } catch (error) {
      toast.error("Erro ao processar isenção")
    } finally {
      setExempting(null)
    }
  }

  const getStageBadge = (row: QueueRow) => {
    if (row.profile.email_opt_out_at) {
      return <Badge variant="secondary" className="bg-gray-200 text-gray-800">Opt-out (Sem avisos)</Badge>
    }
    if (row.notice_1d_sent_at) {
      return <Badge variant="destructive" className="animate-pulse">Aviso 1 Dia</Badge>
    }
    if (row.notice_30d_sent_at) {
      return <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">Aviso 30 Dias</Badge>
    }
    return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">Na fila (Aguardando 60d)</Badge>
  }

  const getInactiveStageBadge = (row: InactiveQueueRow) => {
    if (row.notice_30d_sent_at) {
      return <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">Aviso 30 Dias</Badge>
    }
    return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">Na fila (Erro)</Badge>
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return "-"
    return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR })
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <UserMinus className="h-8 w-8 text-rose-600" /> Retenção LGPD
          </h1>
          <p className="text-muted-foreground mt-2">
            Visão geral das exclusões automáticas (contas importadas sem acesso e contas inativas há mais de 1 ano).
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <MenvoDots />
            <p className="text-sm text-muted-foreground">Carregando filas...</p>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Seção de Contas Importadas (Jotform) */}
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <UserMinus className="h-6 w-6 text-gray-600" /> Contas Importadas Sem Acesso
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Exclusão em 90 dias após o primeiro convite.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Na Fila</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{stats.enrolled}</div>
                    <p className="text-xs text-muted-foreground">Aguardando prazo de 60d</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Aviso de 30 Dias</CardTitle>
                    <Mail className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.noticed30d}</div>
                    <p className="text-xs text-muted-foreground">E-mail de 30 dias enviado</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Aviso de 1 Dia</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats.noticed1d}</div>
                    <p className="text-xs text-muted-foreground">E-mail de 1 dia enviado</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Opt-out / Supressão</CardTitle>
                    <CalendarX className="h-4 w-4 text-gray-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-600">{stats.optedOut}</div>
                    <p className="text-xs text-muted-foreground">Sem avisos, exclusão em 90d</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Fila Atual ({queue.length})</CardTitle>
                  <CardDescription>
                    Pessoas que serão excluídas caso não ativem a conta. Você pode isentá-las manualmente (remove a flag de JotForm).
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
                        <tr>
                          <th className="px-4 py-3">Usuário</th>
                          <th className="px-4 py-3">Início do Relógio</th>
                          <th className="px-4 py-3">Estágio</th>
                          <th className="px-4 py-3">Exclusão Agendada</th>
                          <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {queue.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                              Nenhum usuário na fila de importação no momento.
                            </td>
                          </tr>
                        ) : (
                          queue.map((row) => (
                            <tr key={row.user_id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">{row.profile.full_name || "Sem nome"}</div>
                                <div className="text-gray-500 text-xs">{row.profile.email}</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">Campanha: {row.campaign}</div>
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {formatDate(row.clock_started_at)}
                              </td>
                              <td className="px-4 py-3">
                                {getStageBadge(row)}
                              </td>
                              <td className="px-4 py-3 font-medium text-rose-600">
                                {formatDate(row.scheduled_deletion_at)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                      <ShieldCheck className="h-4 w-4" /> Isentar
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Isentar {row.profile.full_name} da exclusão?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Ao isentar, a conta será marcada como cadastro direto (Menvo) e não será mais excluída automaticamente. A pessoa não receberá mais os avisos de exclusão pendente.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleExempt(row.user_id)}
                                        disabled={exempting === row.user_id}
                                      >
                                        Confirmar Isenção
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Seção de Contas Inativas (1 Ano) */}
            <section className="space-y-6">
              <div className="pt-8 border-t">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Moon className="h-6 w-6 text-gray-600" /> Contas Inativas (+ de 1 Ano)
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Exclusão após 30 dias do aviso para pessoas sem login há 12 meses.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Notificados (Aviso de 30 Dias)</CardTitle>
                    <Mail className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{inactiveStats.noticed30d}</div>
                    <p className="text-xs text-muted-foreground">Pessoas avisadas, exclusão pendente</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Fila de Inativos ({inactiveQueue.length})</CardTitle>
                  <CardDescription>
                    Pessoas que não acessam a Menvo há mais de 1 ano. Se logarem, saem da fila automaticamente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
                        <tr>
                          <th className="px-4 py-3">Usuário</th>
                          <th className="px-4 py-3">Último Acesso</th>
                          <th className="px-4 py-3">Estágio</th>
                          <th className="px-4 py-3">Exclusão Agendada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {inactiveQueue.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                              Nenhum usuário na fila de inatividade no momento.
                            </td>
                          </tr>
                        ) : (
                          inactiveQueue.map((row) => (
                            <tr key={row.user_id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">{row.profile.full_name || "Sem nome"}</div>
                                <div className="text-gray-500 text-xs">{row.profile.email}</div>
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {formatDate(row.last_sign_in_at)}
                              </td>
                              <td className="px-4 py-3">
                                {getInactiveStageBadge(row)}
                              </td>
                              <td className="px-4 py-3 font-medium text-rose-600">
                                {formatDate(row.scheduled_deletion_at)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>
            
          </div>
        )}
      </div>
    </PageContainer>
  )
}
