import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { setAvailabilitySchema } from "@/lib/schemas/availability"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/**
 * GET /api/mentors/availability
 * Retorna a lista de regras semanais de disponibilidade do mentor.
 * Suporta query param ?mentor_id=... ou busca pelo usuário autenticado.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mentorIdParam = searchParams.get("mentor_id")

    let targetMentorId = mentorIdParam

    if (!targetMentorId) {
      const serverSupabase = await createServerClient()
      const {
        data: { user },
        error: authError
      } = await serverSupabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json(
          { error: "Não autenticado" },
          { status: 401 }
        )
      }
      targetMentorId = user.id
    }

    const supabase = getAdminClient()
    const { data: slots, error } = await supabase
      .from("mentor_availability")
      .select("*")
      .eq("mentor_id", targetMentorId)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true })

    if (error) {
      console.error("[AVAILABILITY_GET] Erro ao buscar disponibilidade:", error)
      return NextResponse.json(
        { error: "Erro ao buscar horários de disponibilidade" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: slots || []
    })
  } catch (error) {
    console.error("[AVAILABILITY_GET] Erro inesperado:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mentors/availability
 * Salva a grade semanal de disponibilidade do mentor autenticado.
 * Substitui os horários anteriores de forma idempotente.
 */
export async function POST(request: NextRequest) {
  try {
    const serverSupabase = await createServerClient()
    const {
      data: { user },
      error: authError
    } = await serverSupabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const parseResult = setAvailabilitySchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Dados de disponibilidade inválidos",
          details: parseResult.error.flatten()
        },
        { status: 400 }
      )
    }

    const { slots, timezone } = parseResult.data
    const supabase = getAdminClient()

    // 1. Deletar disponibilidades antigas do mentor autenticado
    const { error: deleteError } = await supabase
      .from("mentor_availability")
      .delete()
      .eq("mentor_id", user.id)

    if (deleteError) {
      console.error("[AVAILABILITY_POST] Erro ao limpar slots anteriores:", deleteError)
      return NextResponse.json(
        { error: "Erro ao atualizar horários de disponibilidade" },
        { status: 500 }
      )
    }

    let insertedSlots: any[] = []

    // 2. Inserir novos horários se fornecidos
    if (slots.length > 0) {
      const recordsToInsert = slots.map((slot) => ({
        mentor_id: user.id,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time.length === 5 ? `${slot.start_time}:00` : slot.start_time,
        end_time: slot.end_time.length === 5 ? `${slot.end_time}:00` : slot.end_time,
        timezone: slot.timezone || timezone || "America/Sao_Paulo"
      }))

      const { data: inserted, error: insertError } = await supabase
        .from("mentor_availability")
        .insert(recordsToInsert)
        .select()

      if (insertError) {
        console.error("[AVAILABILITY_POST] Erro ao inserir novos slots:", insertError)
        return NextResponse.json(
          { error: "Erro ao salvar novos horários de disponibilidade" },
          { status: 500 }
        )
      }

      insertedSlots = inserted || []
    }

    // 3. Atualizar timezone no perfil se fornecido
    if (timezone) {
      await supabase
        .from("profiles")
        .update({ timezone, updated_at: new Date().toISOString() })
        .eq("id", user.id)
    }

    return NextResponse.json({
      success: true,
      data: insertedSlots,
      message: "Disponibilidade salva com sucesso"
    })
  } catch (error) {
    console.error("[AVAILABILITY_POST] Erro inesperado:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
