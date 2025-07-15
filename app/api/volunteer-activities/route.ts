import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { z } from "zod"

const createActivitySchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  activity_type: z.string().min(1, "Tipo de atividade é obrigatório"),
  description: z.string().optional(),
  hours: z.number().min(0.5, "Mínimo de 0.5 horas").max(24, "Máximo de 24 horas"),
  date: z.string(),
  evidence_url: z.string().url().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const userOnly = searchParams.get("user_only") === "true"

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    let query = supabase
      .from("volunteer_activities")
      .select(`
        *,
        profiles!volunteer_activities_user_id_fkey(first_name, last_name, email)
      `)
      .order("created_at", { ascending: false })

    if (userOnly) {
      query = query.eq("user_id", user.id)
    }

    const { data, error } = await query

    if (error) {
      console.error("Erro ao buscar atividades:", error)
      return NextResponse.json({ error: "Erro ao buscar atividades" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createActivitySchema.parse(body)

    const { data, error } = await supabase
      .from("volunteer_activities")
      .insert({
        user_id: user.id,
        title: validatedData.title,
        activity_type: validatedData.activity_type,
        description: validatedData.description,
        hours: validatedData.hours,
        date: validatedData.date,
        evidence_url: validatedData.evidence_url,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar atividade:", error)
      return NextResponse.json({ error: "Erro ao registrar atividade" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Atividade registrada com sucesso!",
      data,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
