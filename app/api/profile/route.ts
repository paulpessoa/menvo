import { type NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { updateProfileSchema } from "@/lib/schemas/profile"
import { extractIdentity } from "@/lib/auth/oauth-identity"
import {
  MENTOR_PROFILE_EMBED,
  splitMentorFields,
  withMentorFields,
} from "@/lib/services/mentors/mentor-profile-fields"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const PROFILE_COLUMNS =
  "id, email, first_name, last_name, full_name, avatar_url, slug, bio, expertise_areas, linkedin_url, created_at, updated_at, city, state, country, timezone, languages, job_title, company, mentorship_topics, github_url, website_url, phone, cv_url, portfolio_url, academic_level, institution, course, expected_graduation, learning_goals" as const

// Campos de mentor ficam em mentor_profiles; o embed os traz junto e
// withMentorFields os devolve achatados, no mesmo formato de antes.
const PROFILE_SELECT = `${PROFILE_COLUMNS}, ${MENTOR_PROFILE_EMBED}` as const

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    return { user, error }
  }

  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      return NextResponse.json({ 
        error: "Token ou sessão de autorização necessária",
        details: authError?.message 
      }, { status: 401 })
    }

    // Get and validate the profile data from request body
    const body = await request.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      const errorMessage = parsed.error.issues[0]?.message || "Dados de perfil inválidos"
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { profile: profileFields, mentor: mentorFields } = splitMentorFields(parsed.data)

    // Campos de mentor primeiro, para o select do perfil já voltar atualizado.
    // update (não upsert): só mentor ou candidato tem linha (criada pela RPC
    // request_mentor_verification). O formulário manda esses campos também
    // para mentorados, e eles não devem ganhar linha vazia.
    if (Object.keys(mentorFields).length > 0) {
      const { error: mentorError } = await supabaseAdmin
        .from("mentor_profiles")
        .update(mentorFields)
        .eq("user_id", user.id)

      if (mentorError) {
        console.error("❌ Mentor profile update error:", mentorError)
        return NextResponse.json({
          error: "Erro ao atualizar perfil",
          details: mentorError.message
        }, { status: 500 })
      }
    }

    const { data: updatedRow, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ ...profileFields, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select(PROFILE_SELECT)
      .single()

    if (updateError) {
      if (updateError.code === "23505" && updateError.message.includes("slug")) {
        return NextResponse.json({ error: "Esse endereço de perfil (slug) já está em uso" }, { status: 409 })
      }
      console.error("❌ Profile update error:", updateError)
      return NextResponse.json({ 
        error: "Erro ao atualizar perfil",
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      message: "Perfil atualizado com sucesso",
      profile: updatedRow ? withMentorFields(updatedRow) : null,
    })

  } catch (error) {
    console.error("❌ Unexpected profile update error:", error)
    
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      return NextResponse.json({ 
        error: "Token ou sessão de autorização necessária",
        details: authError?.message 
      }, { status: 401 })
    }

    // Fetch profile from database
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", user.id)
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        // Profile doesn't exist, create it
        // Nome de qualquer provedor (e-mail, Google, LinkedIn...), não só das
        // chaves first_name/last_name do cadastro por e-mail.
        const identity = extractIdentity(user.user_metadata)
        const profileData = {
          id: user.id,
          email: user.email || "",
          first_name: identity.firstName,
          last_name: identity.lastName,
        }

        const { data: newProfile, error: createError } = await supabaseAdmin
          .from("profiles")
          .insert(profileData)
          .select(PROFILE_SELECT)
          .single()

        if (createError) {
          return NextResponse.json({ 
            error: "Erro ao criar perfil",
            details: createError.message 
          }, { status: 500 })
        }

        return NextResponse.json({
          profile: newProfile ? withMentorFields(newProfile) : null,
        })
      } else {
        return NextResponse.json({ 
          error: "Erro ao buscar perfil",
          details: fetchError.message 
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      profile: withMentorFields(profile),
    })

  } catch (error) {
    console.error("❌ Unexpected profile fetch error:", error)
    
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
