import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      bio,
      role,
      location,
      experienceLevel,
      linkedinUrl,
      githubUrl,
      websiteUrl,
      skills
    } = body

    // Validações básicas
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      )
    }

    if (!role || !["mentor", "mentee"].includes(role)) {
      return NextResponse.json(
        { error: "Papel inválido" },
        { status: 400 }
      )
    }

    if (!bio?.trim()) {
      return NextResponse.json(
        { error: "Biografia é obrigatória" },
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
        { status: 400 }
      )
    }

    // Criar perfil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: user.id,
        name: name.trim(),
        bio: bio.trim(),
        role,
        location: location?.trim() || null,
        skills: skills || [],
        experience_level: experienceLevel || null,
        linkedin_url: linkedinUrl?.trim() || null,
        github_url: githubUrl?.trim() || null,
        website_url: websiteUrl?.trim() || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        is_validated: false // Sempre false inicialmente
      })
      .select()
      .single()

    if (profileError) {
      console.error("Erro ao criar perfil:", profileError)
      return NextResponse.json(
        { error: "Erro ao criar perfil" },
        { status: 500 }
      )
    }

    // Se for mentor, criar solicitação de validação automaticamente
    if (role === "mentor") {
      const { error: validationError } = await supabase
        .from("validation_requests")
        .insert({
          user_id: user.id,
          profile_id: profile.id,
          status: "pending"
        })

      if (validationError) {
        console.error("Erro ao criar solicitação de validação:", validationError)
        // Não falhar a criação do perfil por causa disso
      }
    }

    return NextResponse.json({
      message: "Perfil criado com sucesso",
      profile
    })

  } catch (error) {
    console.error("Erro no API route de perfil:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (profileError) {
      if (profileError.code === "PGRST116") {
        // Perfil não encontrado
        return NextResponse.json(
          { error: "Perfil não encontrado" },
          { status: 404 }
        )
      }
      
      console.error("Erro ao buscar perfil:", profileError)
      return NextResponse.json(
        { error: "Erro ao buscar perfil" },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error("Erro no API route de perfil:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      bio,
      location,
      experienceLevel,
      linkedinUrl,
      githubUrl,
      websiteUrl,
      skills
    } = body

    // Validações básicas
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      )
    }

    if (!bio?.trim()) {
      return NextResponse.json(
        { error: "Biografia é obrigatória" },
        { status: 400 }
      )
    }

    // Atualizar perfil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .update({
        name: name.trim(),
        bio: bio.trim(),
        location: location?.trim() || null,
        skills: skills || [],
        experience_level: experienceLevel || null,
        linkedin_url: linkedinUrl?.trim() || null,
        github_url: githubUrl?.trim() || null,
        website_url: websiteUrl?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id)
      .select()
      .single()

    if (profileError) {
      console.error("Erro ao atualizar perfil:", profileError)
      return NextResponse.json(
        { error: "Erro ao atualizar perfil" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Perfil atualizado com sucesso",
      profile
    })

  } catch (error) {
    console.error("Erro no API route de perfil:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
