import { type NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { updateProfileSchema } from "@/lib/schemas/profile"

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

    // Update profile in database
    const updateData = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    }

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("❌ Profile update error:", updateError)
      return NextResponse.json({ 
        error: "Erro ao atualizar perfil",
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      message: "Perfil atualizado com sucesso",
      profile: updatedProfile,
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
      .select("*")
      .eq("id", user.id)
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        // Profile doesn't exist, create it
        const profileData = {
          id: user.id,
          email: user.email || "",
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
          verified: false,
        }

        const { data: newProfile, error: createError } = await supabaseAdmin
          .from("profiles")
          .insert(profileData)
          .select()
          .single()

        if (createError) {
          return NextResponse.json({ 
            error: "Erro ao criar perfil",
            details: createError.message 
          }, { status: 500 })
        }

        return NextResponse.json({
          profile: newProfile,
        })
      } else {
        return NextResponse.json({ 
          error: "Erro ao buscar perfil",
          details: fetchError.message 
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      profile: profile,
    })

  } catch (error) {
    console.error("❌ Unexpected profile fetch error:", error)
    
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
