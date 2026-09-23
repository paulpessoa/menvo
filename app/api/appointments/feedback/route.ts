import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { updateFeedbackSchema } from "@/lib/schemas/appointment"

/**
 * Mentorship-session feedback the current user received (as mentor) or sent
 * (as mentee). Lives under /api/appointments, not /api/feedback — that path
 * is already the general site-feedback endpoint (`lib/schemas/feedback.ts`,
 * the `feedback` table), an unrelated feature.
 *
 * Uses the service-role client for the same reason as
 * /api/appointments/list: the embedded `profiles!reviewer_id` /
 * `profiles!reviewed_id` joins are subject to RLS on `profiles`, and a
 * booked, evaluated session already authorizes each side to see the
 * other's basic name.
 */
export async function GET(request: NextRequest) {
  try {
    const serverSupabase = await createServerClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const type = request.nextUrl.searchParams.get("type") === "sent" ? "sent" : "received"
    const supabase = createServiceRoleClient()

    let query = supabase
      .from("appointment_feedbacks")
      .select(
        `
        id, rating, public_feedback, status, created_at, rejection_reason,
        mentee:profiles!reviewer_id(full_name, email),
        mentor:profiles!reviewed_id(full_name, email)
      `
      )
      .order("created_at", { ascending: false })

    query = type === "received" ? query.eq("reviewed_id", user.id) : query.eq("reviewer_id", user.id)

    const { data, error } = await query
    if (error) {
      console.error("[APPOINTMENTS/FEEDBACK] Erro ao buscar avaliações:", error)
      return NextResponse.json({ error: "Erro ao buscar avaliações" }, { status: 500 })
    }

    return NextResponse.json({ feedbacks: data || [] })
  } catch (error) {
    console.error("[APPOINTMENTS/FEEDBACK] Erro inesperado:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

/**
 * Lets the reviewer edit their own public comment; it goes back to
 * "pending" for moderation, same as the original client-side behavior.
 */
export async function PATCH(request: NextRequest) {
  try {
    const serverSupabase = await createServerClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = updateFeedbackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Dados inválidos" },
        { status: 400 }
      )
    }
    const { feedbackId, publicFeedback } = parsed.data

    const supabase = createServiceRoleClient()

    const { data: existing, error: fetchError } = await supabase
      .from("appointment_feedbacks")
      .select("id, reviewer_id")
      .eq("id", feedbackId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Avaliação não encontrada" }, { status: 404 })
    }

    if (existing.reviewer_id !== user.id) {
      return NextResponse.json(
        { error: "Você só pode editar suas próprias avaliações" },
        { status: 403 }
      )
    }

    const { error: updateError } = await supabase
      .from("appointment_feedbacks")
      .update({
        public_feedback: publicFeedback,
        status: "pending",
        updated_at: new Date().toISOString()
      })
      .eq("id", feedbackId)

    if (updateError) {
      console.error("[APPOINTMENTS/FEEDBACK] Erro ao atualizar avaliação:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar avaliação" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[APPOINTMENTS/FEEDBACK] Erro inesperado:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
