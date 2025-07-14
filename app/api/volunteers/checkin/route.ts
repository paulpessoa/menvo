import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { z } from "zod"

const checkinSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  activity_type: z.string().min(1, "Tipo de atividade é obrigatório"),
  description: z.string().optional(),
  hours: z.number().min(0.5, "Mínimo de 0.5 horas").max(24, "Máximo de 24 horas"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  location: z.string().optional(),
  organization: z.string().optional(),
  evidence_url: z.string().url().optional().or(z.literal("")),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Verificar se o usuário tem permissão
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || !["volunteer", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Sem permissão para fazer checkin" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = checkinSchema.parse(body)

    // Criar atividade de voluntariado
    const { data: activity, error: activityError } = await supabase
      .from("volunteer_activities")
      .insert({
        user_id: user.id,
        title: validatedData.title,
        activity_type: validatedData.activity_type,
        description: validatedData.description,
        hours: validatedData.hours,
        date: validatedData.date,
        location: validatedData.location,
        organization: validatedData.organization,
        evidence_url: validatedData.evidence_url,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (activityError) {
      console.error("Erro ao criar atividade:", activityError)
      return NextResponse.json({ error: "Erro ao registrar atividade" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Atividade registrada com sucesso!",
      activity,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("Erro no checkin:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userOnly = searchParams.get("user_only") === "true"

    let query = supabase
      .from("volunteer_activities")
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false })

    // Se user_only=true, buscar apenas atividades do usuário atual
    if (userOnly) {
      query = query.eq("user_id", user.id)
    } else {
      // Verificar se tem permissão para ver todas as atividades
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      if (!profile || !["admin", "moderator"].includes(profile.role)) {
        query = query.eq("user_id", user.id)
      }
    }

    const { data: activities, error } = await query

    if (error) {
      console.error("Erro ao buscar atividades:", error)
      return NextResponse.json({ error: "Erro ao buscar atividades" }, { status: 500 })
    }

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Erro ao buscar atividades:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
