import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Obter token do header Authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]

    // Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        validation_requests (
          id,
          status,
          requested_at,
          reviewed_at,
          review_notes
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Erro ao buscar perfil' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('Erro no GET /api/profile:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Obter token do header Authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]

    // Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Obter dados do corpo da requisição
    const body = await request.json()
    
    // Validações básicas
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    if (!body.role || !['mentor', 'mentee'].includes(body.role)) {
      return NextResponse.json(
        { error: 'Role deve ser mentor ou mentee' },
        { status: 400 }
      )
    }

    if (body.role === 'mentor' && (!body.skills || body.skills.length === 0)) {
      return NextResponse.json(
        { error: 'Mentores devem ter pelo menos uma habilidade' },
        { status: 400 }
      )
    }

    // Preparar dados para atualização
    const updateData = {
      name: body.name.trim(),
      bio: body.bio?.trim() || null,
      role: body.role,
      location: body.location?.trim() || null,
      skills: body.skills || [],
      experience_level: body.experience_level || null,
      linkedin_url: body.linkedin_url?.trim() || null,
      github_url: body.github_url?.trim() || null,
      website_url: body.website_url?.trim() || null,
      phone: body.phone?.trim() || null,
      company: body.company?.trim() || null,
      position: body.position?.trim() || null,
      years_of_experience: body.years_of_experience || null,
      languages: body.languages || ['Português'],
      updated_at: new Date().toISOString()
    }

    // Atualizar perfil
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil' },
        { status: 500 }
      )
    }

    // Se é a primeira vez completando o perfil, criar solicitação de validação
    if (body.role === 'mentor') {
      const { error: validationError } = await supabase
        .from('validation_requests')
        .upsert({
          user_id: user.id,
          profile_id: profile.id,
          status: 'pending'
        }, {
          onConflict: 'user_id,profile_id'
        })

      if (validationError) {
        console.error('Erro ao criar solicitação de validação:', validationError)
        // Não retornar erro aqui, pois o perfil foi salvo com sucesso
      }
    }

    return NextResponse.json({ 
      message: 'Perfil atualizado com sucesso',
      profile 
    })

  } catch (error) {
    console.error('Erro no PUT /api/profile:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Obter token do header Authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]

    // Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Verificar se já existe perfil
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Perfil já existe' },
        { status: 400 }
      )
    }

    // Obter dados do corpo da requisição
    const body = await request.json()
    
    // Validações básicas
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    if (!body.role || !['mentor', 'mentee'].includes(body.role)) {
      return NextResponse.json(
        { error: 'Role deve ser mentor ou mentee' },
        { status: 400 }
      )
    }

    // Preparar dados para criação
    const profileData = {
      user_id: user.id,
      name: body.name.trim(),
      bio: body.bio?.trim() || null,
      role: body.role,
      location: body.location?.trim() || null,
      skills: body.skills || [],
      experience_level: body.experience_level || null,
      linkedin_url: body.linkedin_url?.trim() || null,
      github_url: body.github_url?.trim() || null,
      website_url: body.website_url?.trim() || null,
      phone: body.phone?.trim() || null,
      company: body.company?.trim() || null,
      position: body.position?.trim() || null,
      years_of_experience: body.years_of_experience || null,
      languages: body.languages || ['Português'],
      is_validated: false
    }

    // Criar perfil
    const { data: profile, error: createError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (createError) {
      console.error('Erro ao criar perfil:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar perfil' },
        { status: 500 }
      )
    }

    // Criar solicitação de validação
    const { error: validationError } = await supabase
      .from('validation_requests')
      .insert({
        user_id: user.id,
        profile_id: profile.id,
        status: 'pending'
      })

    if (validationError) {
      console.error('Erro ao criar solicitação de validação:', validationError)
      // Não retornar erro aqui, pois o perfil foi criado com sucesso
    }

    return NextResponse.json({ 
      message: 'Perfil criado com sucesso',
      profile 
    }, { status: 201 })

  } catch (error) {
    console.error('Erro no POST /api/profile:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
