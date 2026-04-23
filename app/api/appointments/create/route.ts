import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { sendAppointmentRequest } from "@/lib/email/brevo"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { mentor_id, scheduled_at, duration_minutes, mentorship_topics, notes_mentee } = body

    if (!mentor_id || !scheduled_at) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Gerar token único para confirmação via email
    const actionToken = crypto.randomBytes(32).toString("hex")

    // Criar agendamento
    const { data: appointment, error: insertError } = await (supabase
      .from("appointments" as any)
      // @ts-ignore
      .insert({
        mentor_id,
        mentee_id: user.id,
        scheduled_at,
        duration_minutes: duration_minutes || 60,
        mentorship_topics: mentorship_topics || [],
        notes_mentee: notes_mentee || "",
        action_token: actionToken,
        status: "pending"
      })
      .select(`
        *,
        mentor:profiles!mentor_id(full_name, avatar_url, email),
        mentee:profiles!mentee_id(full_name, avatar_url, email)
      `)
      .single() as any)

    if (insertError) {
      console.error("❌ [CREATE APPOINTMENT] Erro ao inserir:", insertError)
      throw insertError
    }

    // Enviar email de notificação para o mentor
    try {
      await sendAppointmentRequest({
        mentorEmail: appointment.mentor.email,
        mentorName: appointment.mentor.full_name,
        menteeName: appointment.mentee.full_name,
        scheduledAt: appointment.scheduled_at,
        message: appointment.notes_mentee || "Nenhuma mensagem enviada.",
        token: actionToken
      })
      console.log("✅ [CREATE APPOINTMENT] Email enviado para o mentor:", appointment.mentor.email)
    } catch (emailError) {
      console.error("❌ [CREATE APPOINTMENT] Erro ao enviar email para mentor:", emailError)
    }

    // Notificar Admin (MENVO)
    try {
      const { sendAppointmentConfirmation } = await import("@/lib/email/brevo")
      // Reutilizando lógica de envio para admin de forma simplificada
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY || ""
        },
        body: JSON.stringify({
          sender: { name: "Menvo Sistema", email: "contato@menvo.com.br" },
          to: [{ email: "contato@menvo.com.br", name: "Admin Menvo" }],
          subject: `🚨 Nova Solicitação: ${appointment.mentee.full_name} -> ${appointment.mentor.full_name}`,
          htmlContent: `
            <h3>Nova solicitação de mentoria no sistema</h3>
            <p><strong>Mentor:</strong> ${appointment.mentor.full_name} (${appointment.mentor.email})</p>
            <p><strong>Mentee:</strong> ${appointment.mentee.full_name} (${appointment.mentee.email})</p>
            <p><strong>Data:</strong> ${new Date(appointment.scheduled_at).toLocaleString("pt-BR")}</p>
            <p><strong>Notas:</strong> ${appointment.notes_mentee}</p>
          `
        })
      })
    } catch (adminNotifyError) {
      console.error("❌ [CREATE APPOINTMENT] Erro ao notificar admin:", adminNotifyError)
    }

    return NextResponse.json({ success: true, appointment }, { status: 201 })
  } catch (error: any) {
    console.error("❌ [CREATE APPOINTMENT] Erro inesperado:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
