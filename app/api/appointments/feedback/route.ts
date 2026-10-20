import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { updateFeedbackSchema } from "@/lib/schemas/appointment"
import { buildAppointmentsService } from "@/lib/services/appointments/appointments.composition"

/**
 * Mentorship-session feedback the current user received (as mentor) or sent
 * (as mentee). Lives under /api/appointments, not /api/feedback - that path
 * is already the general site-feedback endpoint (`lib/schemas/feedback.ts`,
 * the `feedback` table), an unrelated feature.
 *
 * Runs with the client chosen in `appointments.composition.ts` (today
 * `service_role`, temporary): the embedded `profiles!reviewer_id` /
 * `profiles!reviewed_id` joins are subject to RLS on `profiles`, and a booked,
 * evaluated session already authorizes each side to see the other's name.
 * Fino de propósito: auth -> Zod -> `appointments.service` -> status HTTP.
 */
export async function GET(request: NextRequest) {
  try {
    const serverSupabase = await createServerClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const type = request.nextUrl.searchParams.get("type") === "sent" ? "sent" : "received"
    const feedbacks = await buildAppointmentsService(serverSupabase).listFeedbacks(user.id, type)
    return NextResponse.json({ feedbacks })
  } catch (error) {
    console.error("[APPOINTMENTS/FEEDBACK] Erro ao buscar avaliações:", error)
    return NextResponse.json({ error: "Erro ao buscar avaliações" }, { status: 500 })
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

    const result = await buildAppointmentsService(serverSupabase).updateOwnFeedback(feedbackId, user.id, publicFeedback)
    switch (result.kind) {
      case "ok":
        return NextResponse.json({ success: true })
      case "not_found":
        return NextResponse.json({ error: "Avaliação não encontrada" }, { status: 404 })
      case "forbidden":
        return NextResponse.json({ error: "Você só pode editar suas próprias avaliações" }, { status: 403 })
    }
  } catch (error) {
    console.error("[APPOINTMENTS/FEEDBACK] Erro ao atualizar avaliação:", error)
    return NextResponse.json({ error: "Erro ao atualizar avaliação" }, { status: 500 })
  }
}
