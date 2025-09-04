import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { logAdminAction } from "@/lib/audit-logger"

// This endpoint uses service role for full admin access
async function createServiceClient() {
  const { createClient } = await import("@supabase/supabase-js")
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations")
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

async function checkAdminAccess(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return { isAdmin: false, error: "Unauthorized" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_role")
    .eq("id", user.id)
    .single()

  if (profile?.user_role !== "admin") {
    return { isAdmin: false, error: "Admin access required" }
  }

  return { isAdmin: true, user }
}

// GET - List all users with full details
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess(request)
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error }, { status: 403 })
    }

    const serviceSupabase = await createServiceClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const search = searchParams.get("search") || ""
    const roleFilter = searchParams.get("role") || ""
    
    const offset = (page - 1) * limit

    // Build query
    let query = serviceSupabase
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        user_role,
        verification_status,
        is_volunteer,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    
    if (roleFilter) {
      query = query.eq("user_role", roleFilter)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: users, error } = await query

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = serviceSupabase
      .from("profiles")
      .select("id", { count: "exact", head: true })

    if (search) {
      countQuery = countQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    
    if (roleFilter) {
      countQuery = countQuery.eq("user_role", roleFilter)
    }

    const { count } = await countQuery

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error("Error in admin users API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess(request)
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error }, { status: 403 })
    }

    const serviceSupabase = await createServiceClient()
    const body = await request.json()
    
    const { email, password, full_name, user_role = "mentee" } = body

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: "Email, password, and full_name are required" },
        { status: 400 }
      )
    }

    // Create auth user
    const { data: authUser, error: authError } = await serviceSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created users
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create profile
    const { data: profile, error: profileError } = await serviceSupabase
      .from("profiles")
      .insert({
        id: authUser.user.id,
        email,
        full_name,
        user_role,
        verification_status: "verified" // Auto-verify admin-created users
      })
      .select()
      .single()

    if (profileError) {
      // Cleanup: delete auth user if profile creation fails
      await serviceSupabase.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "User created successfully",
      user: { ...profile, auth_user: authUser.user }
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess(request)
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error }, { status: 403 })
    }

    const serviceSupabase = await createServiceClient()
    const body = await request.json()
    
    const { userId, updates } = body

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Update profile
    const { data: profile, error: profileError } = await serviceSupabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)
      .select()
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Update auth user if email is being changed
    if (updates.email) {
      const { error: authError } = await serviceSupabase.auth.admin.updateUserById(
        userId,
        { email: updates.email }
      )
      
      if (authError) {
        console.error("Error updating auth email:", authError)
        // Don't fail the whole request, just log the error
      }
    }

    return NextResponse.json({ 
      message: "User updated successfully",
      user: profile
    })

  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess(request)
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error }, { status: 403 })
    }

    const serviceSupabase = await createServiceClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Prevent self-deletion
    if (userId === adminCheck.user?.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Delete auth user (this will cascade delete the profile due to foreign key)
    const { error: authError } = await serviceSupabase.auth.admin.deleteUser(userId)

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "User deleted successfully" })

  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}