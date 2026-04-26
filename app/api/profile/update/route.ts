import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { ErrorHandler } from '@/lib/error-handler'
import { Database } from '@/lib/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return ErrorHandler.handleApiError(new Error("Unauthorized"), "AUTH_MISSING", 401)
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return ErrorHandler.handleApiError(authError || new Error("Invalid token"), "AUTH_INVALID", 401)
    }

    const body = await request.json()

    // Filtrar campos permitidos
    const updateData: any = {
      first_name: body.first_name,
      last_name: body.last_name,
      bio: body.bio,
      avatar_url: body.avatar_url,
      city: body.city,
      state: body.state,
      country: body.country,
      job_title: body.job_title,
      company: body.company,
      expertise_areas: body.expertise_areas,
      mentorship_topics: body.mentorship_topics,
      inclusive_tags: body.inclusive_tags,
      linkedin_url: body.linkedin_url,
      github_url: body.github_url,
      website_url: body.website_url,
      portfolio_url: body.portfolio_url,
      languages: body.languages,
      institution: body.institution,
      course: body.course,
      academic_level: body.academic_level,
      expected_graduation: body.expected_graduation,
      is_public: body.is_public,
      learning_goals: body.learning_goals,
      updated_at: new Date().toISOString()
    }

    // Remover campos undefined
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key])

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      message: "Perfil atualizado com sucesso",
      profile: updatedProfile,
    })

  } catch (error: any) {
    return ErrorHandler.handleApiError(error, "UPDATE_FAILED", 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return ErrorHandler.handleApiError(new Error("Unauthorized"), "AUTH_MISSING", 401)
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return ErrorHandler.handleApiError(authError || new Error("Invalid token"), "AUTH_INVALID", 401)
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) throw profileError

    const { data: userRoles } = await supabaseAdmin
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id)

    const roles = userRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || []

    return NextResponse.json({
      profile: {
        ...profile,
        roles
      }
    })

  } catch (error: any) {
    return ErrorHandler.handleApiError(error, "FETCH_FAILED", 500)
  }
}
