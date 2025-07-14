import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getUserPermissions } from "@/lib/auth/rbac"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar se o usuário está autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Erro ao buscar perfil:", profileError)
      return NextResponse.json({ error: "Erro ao buscar perfil" }, { status: 500 })
    }

    // Obter permissões do usuário
    const permissions = getUserPermissions(profile.role)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      profile,
      permissions,
    })
  } catch (error) {
    console.error("Erro na API /auth/me:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
