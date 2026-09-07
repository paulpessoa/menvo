"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, Video, ExternalLink, Loader2 } from "lucide-react"
import { Link } from "@/i18n/routing"

export interface MentorAppointment {
  id: string
  scheduled_at: string
  duration_minutes: number
  status: string
  google_meet_link?: string | null
  mentee: {
    full_name: string
    avatar_url: string | null
    job_title: string | null
  }
}

interface MentorUpcomingSessionsProps {
  appointments: MentorAppointment[]
  loading: boolean
  locale: string
}

/**
 * Exibe a lista de próximas sessões do mentor com link direto para o Google Meet,
 * status do agendamento e atalhos rápidos para gerenciamento.
 */
export function MentorUpcomingSessions({
  appointments,
  loading,
  locale
}: MentorUpcomingSessionsProps) {
  return (
    <Card className="rounded-2xl border border-gray-100 shadow-xs bg-white overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Próximas Sessões
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Suas mentorias agendadas com link direto para o encontro
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild className="rounded-xl font-medium text-xs">
          <Link href="/mentorship/mentor">Ver Todas</Link>
        </Button>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-10 px-4 text-center rounded-2xl border border-dashed border-gray-200 bg-gradient-to-b from-gray-50/50 to-transparent flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 shadow-xs">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <p className="font-semibold text-gray-900 text-sm mb-1">
              Nenhuma sessão agendada nos próximos dias
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mb-4 leading-relaxed">
              Mantenha sua agenda aberta para que novos alunos possam encontrar horários e agendar sessões de 45 minutos com você.
            </p>
            <Button asChild size="sm" className="rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs">
              <Link href="/dashboard/mentor/availability">Configurar Horários (45 min)</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {appointments.map((appt) => {
              const dateObj = new Date(appt.scheduled_at)
              const isToday = dateObj.toDateString() === new Date().toDateString()
              const isConfirmed = appt.status === "confirmed"

              return (
                <div
                  key={appt.id}
                  className="p-4 rounded-2xl border border-gray-100 hover:border-primary/30 transition-all bg-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar className="h-11 w-11 border shrink-0">
                      <AvatarImage src={appt.mentee.avatar_url || undefined} />
                      <AvatarFallback className="font-bold text-primary bg-primary/10">
                        {appt.mentee.full_name[0] || "M"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {appt.mentee.full_name}
                        </p>
                        {isToday && (
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                            Hoje
                          </Badge>
                        )}
                        <Badge
                          variant={isConfirmed ? "default" : "outline"}
                          className={`text-[10px] font-semibold ${
                            isConfirmed ? "bg-emerald-600 hover:bg-emerald-600 text-white" : "text-amber-700 border-amber-300 bg-amber-50"
                          }`}
                        >
                          {isConfirmed ? "Confirmada" : "Aguardando Aprovação"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {appt.mentee.job_title || "Mentorado Menvo"}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className={isToday ? "font-semibold text-gray-900" : ""}>
                          {dateObj.toLocaleString(locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                        <span>({appt.duration_minutes || 45} min)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    {isConfirmed && appt.google_meet_link && (
                      <Button
                        asChild
                        size="sm"
                        className="flex-1 sm:flex-initial font-bold rounded-xl h-9 bg-primary hover:bg-primary/90 text-white shadow-xs"
                      >
                        <a
                          href={appt.google_meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Entrar no Meet</span>
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                        </a>
                      </Button>
                    )}
                    <Button
                      asChild
                      size="sm"
                      variant={isConfirmed && appt.google_meet_link ? "outline" : "secondary"}
                      className="flex-1 sm:flex-initial font-bold rounded-xl h-9 px-3"
                    >
                      <Link href="/mentorship/mentor">Gerenciar</Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
