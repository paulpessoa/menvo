import type { SupabaseClient, User } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import type { ChipOption } from "@/lib/ai/protocol"
import { diagnosticService } from "@/lib/services/diagnostic/diagnostic.service"

export interface UserBriefing {
  user: {
    id: string
    firstName: string
    fullName: string
    role: "mentee" | "mentor" | "admin"
  }
  diagnostic: {
    completedThisMonth: boolean
    reportUrl: string | null
    startUrl: string
  }
  appointments: {
    upcomingCount: number
    nextSession: {
      id: string
      scheduledAt: string
      dateFormatted: string
      timeFormatted: string
      otherPartyName: string
      otherPartyJobTitle: string | null
      otherPartyAvatarUrl: string | null
      status: string
      meetLink: string | null
    } | null
  }
  pendingActions: {
    hasPendingEvaluations: boolean
    pendingEvaluationsCount: number
    pendingRequestsCount: number
  }
  greetingMessage: string
  suggestedChips: ChipOption[]
}

/**
 * Generates a deterministic, zero-token briefing for the logged-in user when opening /assistant.
 *
 * Checks user profile, monthly diagnostic status, upcoming mentorships, and pending
 * actions (unreviewed completed sessions for mentees, or pending requests for mentors).
 */
export async function getUserBriefing(
  supabase: SupabaseClient<Database>,
  user: User
): Promise<UserBriefing> {
  // 1. Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, full_name, job_title")
    .eq("id", user.id)
    .maybeSingle()

  // 2. Fetch user roles from user_roles table
  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", user.id)
    .returns<{ roles: { name: string } | null }[]>()

  const roleNames = (roleRows ?? [])
    .map((row) => row.roles?.name)
    .filter((name): name is string => Boolean(name))

  const role: "mentee" | "mentor" | "admin" =
    roleNames.includes("admin")
      ? "admin"
      : roleNames.includes("mentor")
      ? "mentor"
      : "mentee"

  const firstName =
    profile?.first_name ||
    user.user_metadata?.first_name ||
    profile?.full_name?.split(" ")[0] ||
    user.user_metadata?.full_name?.split(" ")[0] ||
    "colega"

  const fullName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
    firstName

  // 2. Check diagnostic completion this month
  const latestDiagnostic = await diagnosticService.getLatestCompletedSession(supabase, user.id)
  let completedThisMonth = false
  let reportUrl: string | null = null

  if (latestDiagnostic?.completed_at) {
    const completedDate = new Date(latestDiagnostic.completed_at)
    const now = new Date()
    // Compare year and month in America/Sao_Paulo (or ISO equivalent)
    if (
      completedDate.getFullYear() === now.getFullYear() &&
      completedDate.getMonth() === now.getMonth()
    ) {
      completedThisMonth = true
      reportUrl = latestDiagnostic.quiz_response_id
        ? `/quiz/results/${latestDiagnostic.quiz_response_id}`
        : null
    }
  }

  // 3. Appointments & Pending Feedback
  const nowIso = new Date().toISOString()
  let upcomingCount = 0
  let nextSession: UserBriefing["appointments"]["nextSession"] = null
  let hasPendingEvaluations = false
  let pendingEvaluationsCount = 0
  let pendingRequestsCount = 0

  if (role === "mentor") {
    // Mentor appointments
    const { data: mentorApts } = await supabase
      .from("appointments")
      .select("id, status, scheduled_at, google_meet_link, meeting_link, mentee:profiles!mentee_id(full_name, avatar_url, job_title)")
      .eq("mentor_id", user.id)
      .neq("status", "cancelled")
      .gte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })

    const list = mentorApts || []
    upcomingCount = list.length

    const pendingList = list.filter((a) => a.status === "pending")
    pendingRequestsCount = pendingList.length

    if (list.length > 0) {
      const first = list[0]
      const mentee = Array.isArray(first.mentee) ? first.mentee[0] : first.mentee
      const scheduledDate = new Date(first.scheduled_at)

      nextSession = {
        id: first.id,
        scheduledAt: first.scheduled_at,
        dateFormatted: scheduledDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
        timeFormatted: scheduledDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        otherPartyName: mentee?.full_name || "Mentorado",
        otherPartyJobTitle: mentee?.job_title || null,
        otherPartyAvatarUrl: mentee?.avatar_url || null,
        status: first.status,
        meetLink: first.google_meet_link || first.meeting_link || null
      }
    }
  } else {
    // Mentee appointments & feedback
    const { data: menteeApts } = await supabase
      .from("appointments")
      .select("id, status, scheduled_at, google_meet_link, meeting_link, mentor:profiles!mentor_id(full_name, avatar_url, job_title)")
      .eq("mentee_id", user.id)
      .neq("status", "cancelled")
      .order("scheduled_at", { ascending: true })

    const apts = menteeApts || []
    const upcoming = apts.filter((a) => a.scheduled_at >= nowIso)
    upcomingCount = upcoming.length

    if (upcoming.length > 0) {
      const first = upcoming[0]
      const mentor = Array.isArray(first.mentor) ? first.mentor[0] : first.mentor
      const scheduledDate = new Date(first.scheduled_at)

      nextSession = {
        id: first.id,
        scheduledAt: first.scheduled_at,
        dateFormatted: scheduledDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
        timeFormatted: scheduledDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        otherPartyName: mentor?.full_name || "Mentor",
        otherPartyJobTitle: mentor?.job_title || null,
        otherPartyAvatarUrl: mentor?.avatar_url || null,
        status: first.status,
        meetLink: first.google_meet_link || first.meeting_link || null
      }
    }

    // Check completed or past confirmed appointments needing feedback
    const finishedApts = apts.filter((a) => a.status === "completed" || (a.status === "confirmed" && a.scheduled_at < nowIso))
    if (finishedApts.length > 0) {
      const { data: feedbacks } = await supabase
        .from("appointment_feedbacks")
        .select("appointment_id")
        .eq("reviewer_id", user.id)

      const evaluatedIds = new Set((feedbacks || []).map((f) => f.appointment_id))
      const pendingEvals = finishedApts.filter((a) => !evaluatedIds.has(a.id))
      hasPendingEvaluations = pendingEvals.length > 0
      pendingEvaluationsCount = pendingEvals.length
    }
  }

  // 4. Time of day greeting
  const currentHour = new Date().getHours()
  const timeGreeting = currentHour < 12 ? "Bom dia" : currentHour < 18 ? "Boa tarde" : "Boa noite"

  // 5. Construct Greeting Message & Chips
  let greeting = `${timeGreeting}, **${firstName}**! 👋 Sou o Copiloto da Menvo.`
  const suggestedChips: ChipOption[] = []

  if (role === "mentor") {
    greeting += "\n\nAqui está o seu resumo de mentoria:"
    if (nextSession) {
      greeting += `\n• 📅 **Próxima mentoria:** ${nextSession.dateFormatted} às ${nextSession.timeFormatted} com **${nextSession.otherPartyName}** (${nextSession.status === "confirmed" ? "confirmada" : "aguardando confirmação"}).`
    } else {
      greeting += "\n• 📅 Você não possui mentorias agendadas para os próximos dias."
    }

    if (pendingRequestsCount > 0) {
      greeting += `\n• ⏳ Você tem **${pendingRequestsCount} solicitação(ões)** de mentoria aguardando sua resposta.`
    }

    greeting += "\n\nComo posso te apoiar hoje?"

    suggestedChips.push(
      { label: "📅 Minhas Próximas Sessões", value: "Quais são as minhas próximas mentorias agendadas?" },
      { label: "👥 Solicitações Pendentes", value: "Tenho alguma solicitação de mentoria pendente?" },
      { label: "❓ Dúvidas sobre a plataforma", value: "Como funciona a confirmação e realização de mentorias na Menvo?" }
    )
  } else {
    // Mentee
    greeting += "\n\nAqui está um resumo do seu momento:"

    if (nextSession) {
      greeting += `\n• 📅 **Próxima mentoria:** ${nextSession.dateFormatted} às ${nextSession.timeFormatted} com **${nextSession.otherPartyName}**.`
    } else {
      greeting += "\n• 📅 Nenhuma mentoria agendada no momento."
    }

    if (completedThisMonth && reportUrl) {
      greeting += `\n• 🎯 **Diagnóstico de Carreira:** Você já completou sua análise gratuita deste mês.`
    } else {
      greeting += `\n• 🎯 **Diagnóstico de Carreira:** Seu diagnóstico gratuito deste mês está disponível!`
    }

    if (hasPendingEvaluations) {
      greeting += `\n• ✍️ Você tem **${pendingEvaluationsCount} mentoria(s) concluída(s)** aguardando sua avaliação.`
    }

    greeting += "\n\nComo posso te ajudar hoje?"

    if (!completedThisMonth) {
      suggestedChips.push({
        label: "🚀 Fazer Diagnóstico de Carreira",
        value: "mode:diagnostic"
      })
    } else if (reportUrl) {
      suggestedChips.push({
        label: "📄 Ver Meu Diagnóstico",
        value: `link:${reportUrl}`
      })
    }

    suggestedChips.push(
      { label: "🔍 Buscar Mentores", value: "Quero encontrar mentores ideais para o meu momento profissional" },
      { label: "📅 Minhas Mentorias", value: "Quais são as minhas próximas mentorias agendadas?" }
    )

    if (hasPendingEvaluations) {
      suggestedChips.push({
        label: "⭐ Avaliar Mentoria no Chat",
        value: "Quero avaliar minha mentoria pendente"
      })
    }

    suggestedChips.push({
      label: "❓ Como funciona a Menvo?",
      value: "Como funciona a plataforma Menvo e as mentorias gratuitas?"
    })
  }

  return {
    user: {
      id: user.id,
      firstName,
      fullName,
      role
    },
    diagnostic: {
      completedThisMonth,
      reportUrl,
      startUrl: "/assistant?mode=diagnostic"
    },
    appointments: {
      upcomingCount,
      nextSession
    },
    pendingActions: {
      hasPendingEvaluations,
      pendingEvaluationsCount,
      pendingRequestsCount
    },
    greetingMessage: greeting,
    suggestedChips
  }
}
