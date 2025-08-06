import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

// POST - Criar perfil no onboarding (como solicitado no prompt)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação usando token de sessão como solicitado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email, bio, role, avatar_url, location } = body

    // Validar dados obrigatórios
    if (!name || !email || !bio || !role) {
      return NextResponse.json(
        { error: "Campos obrigatórios: name, email, bio, role" },
        { status: 400 }
      )
    }

    // Verificar se já existe perfil para este usuário
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: "Perfil já existe para este usuário" },
        { status: 409 }
      )
    }

    // Usar a função SQL para criar perfil (garante que auth.users.id corresponde ao perfil)
    const { data, error } = await supabase.rpc("create_user_profile", {
      p_user_id: user.id,
      p_name: name,
      p_email: email,
      p_bio: bio,
      p_role: role,
      p_avatar_url: avatar_url || null,
      p_location: location || null,
    })

    if (error) {
      console.error("Erro ao criar perfil:", error)
      return NextResponse.json(
        { error: "Erro interno do servidor" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile_id: data,
      message: "Perfil criado com sucesso. Aguarde a validação."
    })

  } catch (error) {
    console.error("Erro no API Route /api/profile:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// GET - Buscar perfil do usuário atual
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Buscar perfil com RLS (user_id = auth.uid())
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(`
        *,
        user_skills (
          skill_id,
          level,
          skills (name, category)
        )
      `)
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") { // PGRST116 = not found
      console.error("Erro ao buscar perfil:", error)
      return NextResponse.json(
        { error: "Erro interno do servidor" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      profile: profile || null,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      }
    })

  } catch (error) {
    console.error("Erro no API Route GET /api/profile:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar perfil (com RLS user_id = auth.uid())
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, bio, avatar_url, location } = body

    // Atualizar perfil (RLS garante que só pode atualizar próprio perfil)
    const { data, error } = await supabase
      .from("profiles")
      .update({
        name,
        bio,
        avatar_url,
        location,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar perfil:", error)
      return NextResponse.json(
        { error: "Erro ao atualizar perfil" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: data,
      message: "Perfil atualizado com sucesso"
    })

  } catch (error) {
    console.error("Erro no API Route PUT /api/profile:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
