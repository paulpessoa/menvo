import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { sendAppointmentConfirmation } from "@/lib/email/brevo"
import {
  createCalendarEvent,
  isGoogleCalendarConfigured,
  getMissingEnvVars
} from "@/lib/services/mentorship/google-calendar.service"

export async function POST(request: NextRequest) {
  try {
    // Usar Service Role para bypass RLS (chamada interna)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse do body
    const body = await request.json()
    const { appointmentId: rawAppointmentId, token, mentorNotes } = body

    // Suportar tanto token quanto appointmentId
    let appointment
    let fetchError

    if (token) {
      // Buscar por token (fluxo do email)
      const result = await supabase
        .from("appointments")
        .select(
          `
          *,
          mentor:profiles!mentor_id(id, full_name, email),
          mentee:profiles!mentee_id(id, full_name, email)
        `
        )
        .eq("action_token", token)
        .single()

      appointment = result.data
      fetchError = result.error
    } else if (rawAppointmentId) {
      // Buscar por ID (UUID como string)
      const appointmentId = rawAppointmentId

      const result = await supabase
        .from("appointments")
        .select(
          `
          *,
          mentor:profiles!mentor_id(id, full_name, email),
          mentee:profiles!mentee_id(id, full_name, email)
        `
        )
        .eq("id", appointmentId)
        .single()

      appointment = result.data
      fetchError = result.error
    } else {
      return NextResponse.json(
        { error: "Token ou appointmentId é obrigatório" },
        { status: 400 }
      )
    }

    if (fetchError) {
      console.error("❌ [CONFIRM] Erro ao buscar appointment:", fetchError)
    }

    if (!appointment) {
      return NextResponse.json(
        { error: "Agendamento não encontrado ou token inválido" },
        { status: 404 }
      )
    }

    // Verificar se já está confirmado
    if (appointment.status === "confirmed") {
      return NextResponse.json(
        {
          success: true,
          message: "Este agendamento já foi confirmado anteriormente!",
          alreadyConfirmed: true
        },
        { status: 200 }
      )
    }

    // Verificar se está pendente
    if (appointment.status !== "pending") {
      return NextResponse.json(
        { error: `Este agendamento está com status: ${appointment.status}` },
        { status: 400 }
      )
    }

    // Criar evento no Google Calendar
    let googleEventId: string | null = null
    let googleMeetLink: string | null = null
    let calendarError: string | null = null
    let calendarResult: any = null

    if (isGoogleCalendarConfigured()) {
      try {
        const startTime = new Date(appointment.scheduled_at)
        const endTime = new Date(
          startTime.getTime() + appointment.duration_minutes * 60 * 1000
        )

        // Montar descrição completa
        let description = `Sessão de mentoria confirmada através da plataforma MENVO.\n\n`
        description += `👤 Mentor: ${appointment.mentor.full_name}\n`
        description += `👤 Mentee: ${appointment.mentee.full_name}\n`
        description += `⏱️ Duração: ${appointment.duration_minutes} minutos\n\n`

        if (appointment.notes_mentee) {
          description += `📝 Mensagem do mentee:\n${appointment.notes_mentee}\n\n`
        }

        if (mentorNotes) {
          description += `💬 Observações do mentor:\n${mentorNotes}\n\n`
        }

        description += `---\n`
        description += `Plataforma: MENVO - Mentoria Voluntária\n`
        description += `🔗 Link do Meet será gerado automaticamente`

        const eventData = {
          summary: `Mentoria: ${appointment.mentor.full_name} & ${appointment.mentee.full_name}`,
          description,
          startTime,
          endTime,
          mentorEmail: appointment.mentor.email,
          mentorName: appointment.mentor.full_name,
          menteeEmail: appointment.mentee.email,
          menteeName: appointment.mentee.full_name
        }

        calendarResult = await createCalendarEvent(eventData)
        googleEventId = calendarResult.eventId
        googleMeetLink = calendarResult.meetLink
      } catch (error) {
        console.error(
          "❌ [CONFIRM] Erro ao criar evento no Google Calendar:",
          error
        )
        calendarError =
          error instanceof Error ? error.message : "Erro desconhecido"
        // Continua mesmo com erro no calendar
      }
    } else {
      const missing = getMissingEnvVars().join(", ") || "Configuração incompleta";
      console.warn(
        "⚠️ [CONFIRM] Google Calendar não configurado no servidor. Faltando:", missing
      )
      calendarError = `Google Calendar não configurado. Faltando: ${missing}`
    }

    // Atualizar appointment no banco
    const updateData: any = {
      status: "confirmed",
      updated_at: new Date().toISOString()
    }

    if (googleEventId) {
      updateData.google_event_id = googleEventId
    }

    if (googleMeetLink) {
      updateData.google_meet_link = googleMeetLink
    }

    if (calendarResult?.calendarLink) {
      updateData.google_calendar_link = calendarResult.calendarLink
    }

    if (mentorNotes) {
      // Salvar anotações do mentor no campo separado
      updateData.notes_mentor = mentorNotes
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointment.id)

    if (updateError) {
      console.error("❌ [CONFIRM] Erro ao atualizar appointment:", updateError)
      return NextResponse.json(
        {
          error: "Erro ao atualizar agendamento",
          details: updateError.message
        },
        { status: 500 }
      )
    }

    // Enviar email de confirmação
    try {
      await sendAppointmentConfirmation({
        mentorEmail: appointment.mentor.email,
        menteeEmail: appointment.mentee.email,
        mentorName: appointment.mentor.full_name,
        menteeName: appointment.mentee.full_name,
        scheduledAt: appointment.scheduled_at,
        meetLink: googleMeetLink,
        calendarLink: calendarResult?.calendarLink, // Passar o link do calendário se disponível
        menteeNotes: appointment.notes_mentee,
        mentorNotes: mentorNotes
      })
    } catch (emailError) {
      console.error(
        "❌ [CONFIRM] Erro ao enviar email de confirmação:",
        emailError
      )
      // Não falhar a requisição se o email falhar
    }

    return NextResponse.json({
      success: true,
      googleEventId,
      googleMeetLink,
      calendarError,
      message: googleEventId
        ? "Mentoria confirmada e evento criado no Google Calendar"
        : "Mentoria confirmada (evento do Calendar não foi criado)"
    })
  } catch (error) {
    console.error("❌ [CONFIRM] Erro inesperado:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
