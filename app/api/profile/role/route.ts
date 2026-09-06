import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { role, profileData } = body

    if (!role || !["mentor", "mentee"].includes(role)) {
      return NextResponse.json({ error: "Role inválida" }, { status: 400 })
    }

    // 1. Atualizar o perfil do usuário
    const profileUpdates: Record<string, any> = {
      user_role: role,
      verification_status: role === "mentor" ? "pending" : "approved",
      updated_at: new Date().toISOString(),
    }

    if (profileData && typeof profileData === "object") {
      if (typeof profileData.bio === "string") profileUpdates.bio = profileData.bio
      if (typeof profileData.job_title === "string") profileUpdates.job_title = profileData.job_title
      if (typeof profileData.company === "string") profileUpdates.company = profileData.company
      if (typeof profileData.linkedin_url === "string") profileUpdates.linkedin_url = profileData.linkedin_url
      if (typeof profileData.city === "string") profileUpdates.city = profileData.city
      if (typeof profileData.state === "string") profileUpdates.state = profileData.state
      if (typeof profileData.country === "string") profileUpdates.country = profileData.country
      if (typeof profileData.learning_goals === "string") profileUpdates.learning_goals = profileData.learning_goals
      if (Array.isArray(profileData.expertise_areas)) profileUpdates.expertise_areas = profileData.expertise_areas
      if (Array.isArray(profileData.mentorship_topics)) profileUpdates.mentorship_topics = profileData.mentorship_topics
      if (Array.isArray(profileData.inclusive_tags)) profileUpdates.inclusive_tags = profileData.inclusive_tags
    }

    const { error: updateError } = await (supabase
      .from("profiles") as any)
      .update(profileUpdates)
      .eq("id", user.id);

    if (updateError) {
      console.error("❌ Erro ao salvar perfil:", updateError)
      return NextResponse.json({ error: "Erro ao salvar role" }, { status: 500 })
    }

    if (role === "mentor") {
      const { error: validationError } = await (supabase
        .from("validation_requests") as any)
        .insert({
          user_id: user.id,
          request_type: "mentor_verification",
          status: "pending",
          created_at: new Date().toISOString(),
        });

      if (validationError) {
        console.error("Erro ao criar solicitação de validação:", validationError)
      }
    }

    // 2. Atribuir a role no sistema de RBAC
    const { data: roleData } = await supabase
      .from("roles")
      .select("id")
      .eq("name", role)
      .single()

    if (roleData) {
      await (supabase
        .from("user_roles") as any)
        .upsert({ 
          user_id: user.id, 
          role_id: (roleData as any).id 
        }, { onConflict: "user_id,role_id" });
    }

    return NextResponse.json({
      success: true,
      message: "Role atualizada com sucesso",
      role,
      status: role === "mentor" ? "pending" : "approved",
    })
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
