import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { email, password, firstName, lastName, userType } = await request.json()

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // Registrar o usuário no Supabase com metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          user_type: userType || "pending",
        },
      },
    })

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: "Erro ao registrar usuário", details: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Usuário não foi criado" }, { status: 400 })
    }

    // The trigger should handle the profile creation automatically
    // But let's add a fallback just in case
    try {
      const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", authData.user.id).single()

      if (!existingProfile) {
        // Fallback: create profile manually if trigger didn't work
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          email: authData.user.email,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          role: (userType || "pending") as any,
          status: "pending",
          verification_status: "pending",
        })

        if (profileError) {
          console.error("Profile creation error:", profileError)
        }
      }
    } catch (fallbackError) {
      console.error("Fallback profile creation error:", fallbackError)
    }

    return NextResponse.json({
      message: "Usuário registrado com sucesso",
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    })
  } catch (error) {
    console.error("Erro no endpoint de registro:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
