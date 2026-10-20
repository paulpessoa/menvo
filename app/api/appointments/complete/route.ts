import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { completeAppointmentSchema } from "@/lib/schemas/appointment"
import { buildAppointmentsService } from "@/lib/services/appointments/appointments.composition"
import { RepositoryError } from "@/lib/repositories/repository-error"
import { transitionBlockedResponse } from "../transition-response"

/**
 * Records the mentee's evaluation of a session and marks it completed.
 *
 * Evaluation is asymmetric by design (see docs/STATUS.md, "Mentorship
 * Evaluation Model"): only the mentee reviews the mentor. This is enforced in
 * `appointments.service`, not just hidden in the UI, since any authenticated
 * user could otherwise POST directly to this route.
 *
 * Fino de propósito: auth -> Zod -> service -> status HTTP.
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

    const result = await buildAppointmentsService().evaluate(appointmentId, user.id, {
      rating,
      privateNotes,
      publicFeedback,
    })
    switch (result.kind) {
      case "ok":
        return NextResponse.json({ success: true })
      case "not_found":
        return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
      case "forbidden":
        return NextResponse.json({ error: "Apenas o mentorado pode avaliar esta mentoria" }, { status: 403 })
      case "wrong_status":
        return NextResponse.json(
          { error: "Só é possível avaliar sessões confirmadas ou concluídas" },
          { status: 400 }
        )
      case "already_evaluated":
        return NextResponse.json({ error: "Esta mentoria já foi avaliada" }, { status: 409 })
      case "feedback_failed":
        return NextResponse.json({ error: "Erro ao registrar avaliação" }, { status: 500 })
      default:
        return transitionBlockedResponse(result)
    }
  } catch (error) {
    console.error("[COMPLETE] Erro inesperado:", error)
    if (error instanceof RepositoryError) {
      return NextResponse.json({ error: "Erro ao concluir agendamento" }, { status: 500 })
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
