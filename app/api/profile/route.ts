import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log("🔄 Starting profile update");

    // Check authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      console.error("❌ No authorization token provided")
      return NextResponse.json({ 
        error: "Token de autorização necessário" 
      }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    console.log("🔍 Validating token...");
    
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.error("❌ Authentication error:", authError)
      return NextResponse.json({ 
        error: "Token inválido",
        details: authError?.message 
      }, { status: 401 })
    }

    console.log("✅ User authenticated:", user.id)

    // Get the profile data from request body
    const profileData = await request.json()
    console.log("📄 Profile data received:", Object.keys(profileData));

    // Validate required fields
    if (profileData.first_name !== undefined && !profileData.first_name?.trim()) {
      return NextResponse.json({ 
        error: "Nome é obrigatório" 
      }, { status: 400 })
    }

    if (profileData.last_name !== undefined && !profileData.last_name?.trim()) {
      return NextResponse.json({ 
        error: "Sobrenome é obrigatório" 
      }, { status: 400 })
    }

    console.log("✅ Validation passed")

    // Update profile in database
    const updateData = {
      ...profileData,
      updated_at: new Date().toISOString(),
    }

    console.log("💾 Updating profile in database...");
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

    console.log("✅ Profile updated successfully");
    
    const duration = Date.now() - startTime;
    console.log(`🎉 Profile update completed in ${duration}ms`);

    return NextResponse.json({
      message: "Perfil atualizado com sucesso",
      profile: updatedProfile,
    })

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("❌ Unexpected profile update error:", error)
    console.error(`💥 Profile update failed after ${duration}ms`);
    
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : 'Unknown error',
      duration 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 Starting profile fetch");

    // Check authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ 
        error: "Token de autorização necessário" 
      }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ 
        error: "Token inválido" 
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
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}