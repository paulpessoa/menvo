import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { availabilityQuerySchema, setAvailabilitySchema } from "@/lib/schemas/availability"
import { buildMentorAvailabilityService } from "@/lib/services/mentors/mentor-availability.composition"

/**
 * GET /api/mentors/availability[?mentor_id=<uuid>] - a agenda semanal de um
 * mentor. Sem `mentor_id`, devolve a de quem está logado.
 *
 * Usa o client do usuário: o RLS (migration 20261008000000) só libera a
 * agenda de mentor aprovado e público, ou a do próprio dono. Antes esta rota
 * usava `service_role` e devolvia a agenda de qualquer id.
 */
export async function GET(request: NextRequest) {
  const query = availabilityQuerySchema.safeParse({
    mentor_id: request.nextUrl.searchParams.get("mentor_id") ?? undefined,
  })
  if (!query.success) {
    return NextResponse.json({ error: "mentor_id inválido" }, { status: 400 })
  }

  const supabase = await createClient()
  let mentorId = query.data.mentor_id

  if (!mentorId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }
    mentorId = user.id
  }

  const result = await buildMentorAvailabilityService(supabase).list(mentorId)
  if (result.kind === "failed") {
    return NextResponse.json({ error: "Erro ao buscar horários de disponibilidade" }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: result.slots })
}

/**
 * POST /api/mentors/availability - substitui a agenda semanal de quem está
 * logado, numa transação (RPC `set_mentor_availability`).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const parsed = setAvailabilitySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados de disponibilidade inválidos", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const result = await buildMentorAvailabilityService(supabase).saveOwn(parsed.data)

  switch (result.kind) {
    case "invalid_range":
      return NextResponse.json(
        { error: "O horário de término deve ser depois do horário de início", code: "INVALID_RANGE" },
        { status: 400 }
      )
    case "failed":
      return NextResponse.json({ error: "Erro ao salvar horários de disponibilidade" }, { status: 500 })
    case "saved":
      return NextResponse.json({
        success: true,
        data: result.slots,
        message: "Disponibilidade salva com sucesso",
      })
  }
}
