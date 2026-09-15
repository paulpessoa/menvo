import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { updateUserRoleSchema } from "@/lib/schemas/profile"

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

    const rawBody = await request.json().catch(() => ({}))
    const validation = updateUserRoleSchema.safeParse(rawBody)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Dados inválidos" },
        { status: 400 }
      )
    }

    const { role, profileData } = validation.data

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
    // "mentor" e "mentee" são mutuamente exclusivos: sem isso, um usuário que
    // troca de role pelo onboarding (ex.: reenvia o POST) acumula as duas
    // linhas em user_roles, o que quebra todo endpoint admin que faz
    // `.select("roles(name)").single()` para esse usuário. Não tocamos em
    // "admin"/"moderator", que são atribuídas por outro fluxo.
    const { data: exclusiveRoles } = await supabase
      .from("roles")
      .select("id, name")
      .in("name", ["mentor", "mentee"])

    const roleIdByName = new Map(
      (exclusiveRoles ?? []).map(r => [(r as any).name as string, (r as any).id as number])
    )
    const otherRoleIds = [...roleIdByName.entries()]
      .filter(([name]) => name !== role)
      .map(([, id]) => id)

    if (otherRoleIds.length > 0) {
      await (supabase
        .from("user_roles") as any)
        .delete()
        .eq("user_id", user.id)
        .in("role_id", otherRoleIds)
    }

    const roleId = roleIdByName.get(role)
    if (roleId) {
      await (supabase
        .from("user_roles") as any)
        .upsert({
          user_id: user.id,
          role_id: roleId
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
