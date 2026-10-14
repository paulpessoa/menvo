import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { createAvailabilityAlertSchema, queryAvailabilityAlertSchema } from "@/lib/schemas/availability-alert"
import { buildAvailabilityAlertService } from "@/lib/services/mentors/availability-alert.composition"

/**
 * GET /api/mentors/availability-alerts?mentor_id=<uuid>
 * Verifica se o usuário logado possui alerta ativo/pendente para este mentor.
 */
export async function GET(request: NextRequest) {
  const query = queryAvailabilityAlertSchema.safeParse({
    mentor_id: request.nextUrl.searchParams.get("mentor_id") ?? undefined,
  })

  if (!query.success) {
    return NextResponse.json({ error: "mentor_id inválido" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: true, hasActiveAlert: false })
  }

  const hasActiveAlert = await buildAvailabilityAlertService(supabase).hasActiveAlert(
    query.data.mentor_id,
    user.id
  )

  return NextResponse.json({ success: true, hasActiveAlert })
}

/**
 * POST /api/mentors/availability-alerts
 * Inscreve um mentorado (logado ou visitante com e-mail) para receber aviso
 * quando o mentor cadastrar novos horários.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const parsed = createAvailabilityAlertSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const menteeId = user?.id ?? null
  const email = user?.email || parsed.data.email

  if (!email) {
    return NextResponse.json(
      { error: "Informe um e-mail válido para receber o aviso" },
      { status: 400 }
    )
  }

  const result = await buildAvailabilityAlertService(supabase).subscribe({
    mentor_id: parsed.data.mentor_id,
    mentee_id: menteeId,
    email,
  })

  switch (result.kind) {
    case "invalid_email":
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 })
    case "failed":
      return NextResponse.json({ error: "Não foi possível cadastrar o aviso" }, { status: 500 })
    case "subscribed":
      return NextResponse.json({
        success: true,
        message: "Aviso ativado com sucesso! Você receberá um e-mail assim que novos horários forem abertos.",
      })
  }
}
