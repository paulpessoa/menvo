import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { z } from "zod"

const completeProfileSchema = z.object({
  role: z.enum(["mentee", "mentor", "volunteer"], {
    errorMap: () => ({ message: "Role inválida" }),
  }),
  bio: z.string().optional(),
  location: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal("")),
  presentation_video_url: z.string().url().optional().or(z.literal("")),
  expertise_areas: z.string().optional(),
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

    const body = await request.json()
    const validatedData = completeProfileSchema.parse(body)

    // Atualizar perfil
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        role: validatedData.role,
        bio: validatedData.bio,
        location: validatedData.location,
        linkedin_url: validatedData.linkedin_url,
        presentation_video_url: validatedData.presentation_video_url,
        expertise_areas: validatedData.expertise_areas,
        status: validatedData.role === "mentor" ? "pending" : "active",
        verification_status: validatedData.role === "mentor" ? "pending" : "verified",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Erro ao atualizar perfil:", updateError)
      return NextResponse.json({ error: "Erro ao completar perfil" }, { status: 500 })
    }

    // Se for mentor, criar entrada na tabela mentor_profiles
    if (validatedData.role === "mentor") {
      const { error: mentorError } = await supabase.from("mentor_profiles").upsert({
        user_id: user.id,
        availability: "available",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (mentorError) {
        console.error("Erro ao criar perfil de mentor:", mentorError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Perfil completado com sucesso!",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("Erro ao completar perfil:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
