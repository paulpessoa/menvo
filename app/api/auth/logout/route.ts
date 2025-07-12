import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST() {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("❌ Erro no logout:", error)
      return NextResponse.json({ error: "Erro ao fazer logout" }, { status: 500 })
    }

    console.log("✅ Logout realizado com sucesso")

    return NextResponse.json(
      { success: true, message: "Logout realizado com sucesso" },
      {
        status: 200,
        headers: {
          "Set-Cookie":
            "supabase-auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax",
        },
      },
    )
  } catch (error) {
    console.error("💥 Erro interno no logout:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
