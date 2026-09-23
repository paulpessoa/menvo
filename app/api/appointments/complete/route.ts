import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { completeAppointmentSchema } from "@/lib/schemas/appointment"

/**
 * Records the mentee's evaluation of a session and marks it completed.
 *
 * Evaluation is asymmetric by design (see docs/STATUS.md, "Mentorship
 * Evaluation Model"): only the mentee reviews the mentor. This is enforced
 * here, not just hidden in the UI, since any authenticated user could
 * otherwise POST directly to this route.
 */
export async function POST(request: NextRequest) {
  try {
    const serverSupabase = await createServerClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = completeAppointmentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Dados inválidos" },
        { status: 400 }
      )
    }
    const { appointmentId, rating, privateNotes, publicFeedback } = parsed.data

    const supabase = createServiceRoleClient()

    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, mentor_id, mentee_id, status")
      .eq("id", appointmentId)
      .single()

    if (fetchError || !appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
    }

    if (appointment.mentee_id !== user.id) {
      return NextResponse.json(
        { error: "Apenas o mentorado pode avaliar esta mentoria" },
        { status: 403 }
      )
    }

    if (appointment.status !== "confirmed" && appointment.status !== "completed") {
      return NextResponse.json(
        { error: "Só é possível avaliar sessões confirmadas ou concluídas" },
        { status: 400 }
      )
    }

    const { data: existingFeedback } = await supabase
      .from("appointment_feedbacks")
      .select("id")
      .eq("appointment_id", appointmentId)
      .eq("reviewer_id", user.id)
      .maybeSingle()

    if (existingFeedback) {
      return NextResponse.json({ error: "Esta mentoria já foi avaliada" }, { status: 409 })
    }

    const { error: feedbackError } = await supabase.from("appointment_feedbacks").insert({
      appointment_id: appointmentId,
      reviewer_id: user.id,
      reviewed_id: appointment.mentor_id,
      rating,
      private_notes: privateNotes || null,
      public_feedback: publicFeedback || null
    })

    if (feedbackError) {
      console.error("[COMPLETE] Erro ao gravar feedback:", feedbackError)
      return NextResponse.json({ error: "Erro ao registrar avaliação" }, { status: 500 })
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", appointmentId)

    if (updateError) {
      console.error("[COMPLETE] Erro ao concluir agendamento:", updateError)
      return NextResponse.json({ error: "Erro ao concluir agendamento" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[COMPLETE] Erro inesperado:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
