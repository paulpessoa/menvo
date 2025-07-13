import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("❌ Erro no logout:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("✅ Logout realizado com sucesso")

    return NextResponse.json({
      success: true,
      message: "Logout realizado com sucesso!",
    })
  } catch (error) {
    console.error("💥 Erro interno no logout:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
