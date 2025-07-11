import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import type { Database } from "@/types/database"

type UserRole = Database["public"]["Enums"]["user_role"]

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar se usuário está autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    // Obter dados da requisição
    const { role } = await request.json()

    if (!role || !["mentee", "mentor", "volunteer"].includes(role)) {
      return NextResponse.json({ error: "Role inválida" }, { status: 400 })
    }

    // Atualizar role na tabela profiles
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        role: role as UserRole,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Erro ao atualizar perfil:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        message: "Role atualizada com sucesso",
        role: role,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Erro no endpoint update-role:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
