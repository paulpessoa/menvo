import { type NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    let user;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "")
      const { data } = await supabaseAdmin.auth.getUser(token)
      user = data.user
    } else {
      const supabase = await createServerClient()
      const { data } = await supabase.auth.getUser()
      user = data.user
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { flag, value } = body

    if (!flag || value === undefined) {
      return NextResponse.json({ error: "Missing flag or value" }, { status: 400 })
    }

    // Get current flags
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("onboarding_flags")
      .eq("id", user.id)
      .single()
      
    const currentFlags = profile?.onboarding_flags || {}
    const newFlags = { ...currentFlags, [flag]: value }

    // Update flags
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ onboarding_flags: newFlags })
      .eq("id", user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, onboarding_flags: newFlags })

  } catch (error) {
    console.error("❌ Onboarding flag update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    let user;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "")
      const { data } = await supabaseAdmin.auth.getUser(token)
      user = data.user
    } else {
      const supabase = await createServerClient()
      const { data } = await supabase.auth.getUser()
      user = data.user
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Clear flags
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ onboarding_flags: {} })
      .eq("id", user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, onboarding_flags: {} })

  } catch (error) {
    console.error("❌ Onboarding flag clear error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
