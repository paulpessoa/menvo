import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { z } from "zod"

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = resetPasswordSchema.parse(body)

    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      console.error("Erro ao atualizar senha:", error)
      return NextResponse.json({ error: "Erro ao atualizar senha" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Senha atualizada com sucesso!",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("Erro ao resetar senha:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
