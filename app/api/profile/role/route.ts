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

    const { role } = await request.json()

    if (!role || !["mentor", "mentee"].includes(role)) {
      return NextResponse.json({ error: "Role inválida" }, { status: 400 })
    }

    // 1. Atualizar o perfil do usuário
    const { error: updateError } = await (supabase
      .from("profiles" as any)
      // @ts-ignore
      .update({
        user_role: role,
        verification_status: role === "mentor" ? "pending" : "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id) as any)

    if (updateError) {
      return NextResponse.json({ error: "Erro ao salvar role" }, { status: 500 })
    }

    if (role === "mentor") {
      const { error: validationError } = await (supabase
        .from("validation_requests" as any)
        .insert({
          user_id: user.id,
          request_type: "mentor_verification",
          status: "pending",
          created_at: new Date().toISOString(),
        }) as any)

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
        .from("user_roles" as any)
        .upsert({ 
          user_id: user.id, 
          role_id: roleData.id 
        }) as any)
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
