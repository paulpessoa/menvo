"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Sparkles, Search, Video, Clock } from "lucide-react"
import { Link } from "@/i18n/routing"

interface NextSessionInfo {
  scheduled_at: string
  status: string
  google_meet_link?: string | null
  mentor: {
    full_name: string
    avatar_url: string | null
    job_title: string | null
  }
}

interface MenteeNextStepCardProps {
  hasPendingReview: boolean
  nextSession: NextSessionInfo | null
  quizDone: boolean
  diagnosticHref: string
}

/**
 * Single "what should I do now?" card for the mentee dashboard, replacing the
 * separate pending-review banner and diagnostic CTA that used to compete for
 * attention. The journey is linear (avaliar > sessão agendada > diagnóstico >
 * buscar mentor), so only ONE next action is ever shown at a time.
 *
 * Kept independent from `lib/ai-menvo/copilot/briefing.ts` on purpose: that
 * function is async/server-only (built for `/assistant`, needs a
 * SupabaseClient) and would require a second network round trip here, when
 * the dashboard already has everything it needs from its own fetches.
 */
export function MenteeNextStepCard({ hasPendingReview, nextSession, quizDone, diagnosticHref }: MenteeNextStepCardProps) {
  if (hasPendingReview) {
    return (
      <Card className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent shadow-sm">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
              <Star className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Seu próximo passo: avaliar sua última mentoria</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sua opinião ajuda o mentor a evoluir - e libera seu próximo agendamento.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shrink-0 shadow-sm">
            <Link href="/mentorship/mentee#action">Avaliar Agora</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (nextSession) {
    const dateObj = new Date(nextSession.scheduled_at)
    const isToday = dateObj.toDateString() === new Date().toDateString()
    const isConfirmed = nextSession.status === "confirmed"

    return (
      <Card className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent shadow-sm">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <Avatar className="h-11 w-11 border shrink-0">
              <AvatarImage src={nextSession.mentor.avatar_url || undefined} />
              <AvatarFallback>{nextSession.mentor.full_name[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-foreground truncate">
                Seu próximo passo: {isConfirmed ? "sua mentoria está confirmada" : "aguardando confirmação do mentor"}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {isToday ? "Hoje" : dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} com{" "}
                <strong className="text-foreground">{nextSession.mentor.full_name}</strong>
              </p>
            </div>
          </div>
          {isConfirmed && nextSession.google_meet_link ? (
            <Button asChild size="sm" className="rounded-xl font-semibold shrink-0 shadow-sm">
              <a href={nextSession.google_meet_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" /> Entrar no Meet
              </a>
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground shrink-0 px-3 py-1.5 rounded-xl bg-muted">
              <Clock className="h-3.5 w-3.5" /> Aguardando o mentor
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!quizDone) {
    return (
      <Card className="relative overflow-hidden rounded-2xl border-none bg-gradient-to-r from-primary-800 via-primary-700 to-primary-600 text-white shadow-lg">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-white/15 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Seu próximo passo: faça seu diagnóstico de carreira</h4>
              <p className="text-xs text-white/80 mt-0.5">
                Responda algumas perguntas com IA e receba sugestões de mentores para o seu momento.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="rounded-xl bg-white text-primary hover:bg-white/95 font-bold shrink-0 shadow-sm">
            <Link href={diagnosticHref}>Começar</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent shadow-sm">
      <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Seu próximo passo: encontre um mentor e peça uma sessão</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Explore o catálogo e peça uma mentoria gratuita de 45 minutos.
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="rounded-xl font-bold shrink-0 shadow-sm">
          <Link href="/mentors">Buscar Mentores</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
