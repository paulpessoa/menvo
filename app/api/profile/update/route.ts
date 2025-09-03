import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function PUT(request: NextRequest) {
  try {
    console.log("🔄 Iniciando atualização de perfil")

    // Verificar autenticação
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      console.error("❌ Token de autorização não fornecido")
      return NextResponse.json({ error: "Token de autorização necessário" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.error("❌ Erro de autenticação:", authError)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    console.log("✅ Usuário autenticado:", user.id)

    // Processar dados do perfil
    const body = await request.json()
    console.log("📝 Dados recebidos:", body)

    // Campos permitidos para atualização
    const allowedFields = [
      'first_name',
      'last_name', 
      'bio',
      'avatar_url',
      'age',
      'city',
      'state',
      'country',
      'timezone',
      'languages',
      'job_title',
      'company',
      'experience_years',
      'mentorship_topics',
      'inclusive_tags',
      'session_price_usd',
      'availability_status',
      'linkedin_url',
      'github_url',
      'twitter_url',
      'website_url',
      'phone',
      'expertise_areas'
    ]

    // Filtrar apenas campos permitidos
    const updateData: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Sempre atualizar o timestamp
    updateData.updated_at = new Date().toISOString()

    console.log("🔄 Atualizando perfil com:", updateData)

    // Atualizar perfil
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("❌ Erro ao atualizar perfil:", updateError)
      return NextResponse.json({ 
        error: "Erro ao atualizar perfil", 
        details: updateError.message 
      }, { status: 400 })
    }

    console.log("✅ Perfil atualizado com sucesso")

    return NextResponse.json({
      message: "Perfil atualizado com sucesso",
      profile: updatedProfile,
    })

  } catch (error) {
    console.error("❌ Erro inesperado na atualização:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 Buscando perfil do usuário")

    // Verificar autenticação
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      console.error("❌ Token de autorização não fornecido")
      return NextResponse.json({ error: "Token de autorização necessário" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.error("❌ Erro de autenticação:", authError)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    console.log("✅ Usuário autenticado:", user.id)

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("❌ Erro ao buscar perfil:", profileError)
      return NextResponse.json({ 
        error: "Perfil não encontrado", 
        details: profileError.message 
      }, { status: 404 })
    }

    // Buscar role do usuário
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select(`
        roles (
          name
        )
      `)
      .eq("user_id", user.id)
      .single()

    const role = userRole?.roles ? (userRole.roles as any).name : null

    console.log("✅ Perfil encontrado")

    return NextResponse.json({
      profile: {
        ...profile,
        role
      }
    })

  } catch (error) {
    console.error("❌ Erro inesperado ao buscar perfil:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    }, { status: 500 })
  }
}