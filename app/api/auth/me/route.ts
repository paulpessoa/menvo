import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    // Buscar dados completos do perfil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Erro ao buscar perfil:", profileError)
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    // Buscar permissões do usuário
    const { data: permissions } = await supabase.from("role_permissions").select("permission").eq("role", profile.role)

    const userPermissions = permissions?.map((p) => p.permission) || []

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        ...profile,
        permissions: userPermissions,
      },
    })
  } catch (error) {
    console.error("Erro no endpoint me:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
