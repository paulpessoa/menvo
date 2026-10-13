import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { noShowAppointmentSchema } from "@/lib/schemas/appointment"
import { sendAppointmentCancellation } from "@/lib/email/brevo"

/**
 * Endpoint para o MENTOR registrar a ausência do mentorado (no-show).
 *
 * Atualiza o status do agendamento para `cancelled` por ausência, salva as
 * anotações do mentor em `notes_mentor`, remove eventuais avaliações pendentes
 * ou prematuras do mentorado e envia notificação de cancelamento por ausência.
 */
export async function POST(request: NextRequest) {
  try {
    const serverSupabase = await createServerClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = noShowAppointmentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Dados inválidos" },
        { status: 400 }
      )
    }
    const { appointmentId, notes } = parsed.data

    const supabase = createServiceRoleClient()

    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select(`
        *,
        mentor:mentor_id(id, full_name, email),
        mentee:mentee_id(id, full_name, email)
      `)
      .eq("id", appointmentId)
      .single()

    if (fetchError || !appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
    }

    if (appointment.mentor_id !== user.id) {
      return NextResponse.json(
        { error: "Apenas o mentor pode registrar a ausência do mentorado" },
        { status: 403 }
      )
    }

    // A sessão deve estar no passado para registrar ausência
    const scheduledTime = new Date(appointment.scheduled_at).getTime()
    if (scheduledTime > Date.now()) {
      return NextResponse.json(
        { error: "Só é possível registrar ausência após o horário agendado da sessão" },
        { status: 400 }
      )
    }

    if (appointment.status !== "confirmed" && appointment.status !== "completed") {
      return NextResponse.json(
        { error: "Só é possível registrar ausência para sessões confirmadas ou concluídas" },
        { status: 400 }
      )
    }

    const trimmedNotes = notes?.trim() || null
    const cancellationReason = trimmedNotes
      ? `Mentorado não compareceu: ${trimmedNotes}`
      : "Mentorado não compareceu à sessão"

    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        cancellation_reason: cancellationReason,
        notes_mentor: trimmedNotes || "Mentorado não compareceu à sessão.",
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        completed_at: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", appointmentId)

    if (updateError) {
      console.error("[NO SHOW] Erro ao registrar ausência:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar agendamento" }, { status: 500 })
    }

    // Remover qualquer feedback prematuro ou indevido se a sessão estava como concluída
    await supabase
      .from("appointment_feedbacks")
      .delete()
      .eq("appointment_id", appointmentId)

    // Notificar o mentorado por e-mail com a justificativa de cancelamento por ausência
    try {
      type PersonInfo = { id?: string; full_name?: string | null; email?: string | null }
      const mentor = (Array.isArray(appointment.mentor) ? appointment.mentor[0] : appointment.mentor) as PersonInfo | null
      const mentee = (Array.isArray(appointment.mentee) ? appointment.mentee[0] : appointment.mentee) as PersonInfo | null

      if (mentee?.email) {
        await sendAppointmentCancellation({
          recipientEmail: mentee.email,
          recipientName: mentee.full_name || "Mentorado",
          otherPersonName: mentor?.full_name || "Mentor",
          scheduledAt: appointment.scheduled_at,
          reason: cancellationReason,
          cancelledByName: mentor?.full_name || "Seu mentor",
        })
      }
    } catch (emailErr) {
      console.error("[NO SHOW] Erro ao enviar email de notificação:", emailErr)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[NO SHOW] Erro inesperado:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
