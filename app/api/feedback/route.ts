import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select(`
        role_id,
        roles!inner(name)
      `)
      .eq("user_id", user?.id)

    const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === "admin")

    // Parse query parameters
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    let query = supabase
      .from("feedback")
      .select(`
        *,
        user:profiles(full_name, avatar_url)
      `)
      .order("created_at", { ascending: false })

    // Apply filters based on user role
    if (!isAdmin) {
      // Regular users can only see their own feedback
      query = query.eq("user_id", user?.id)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: feedback, error } = await query

    if (error) {
      console.error("Error fetching feedback:", error)
      return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase.from("feedback").select("*", { count: "exact", head: true })

    if (!isAdmin) {
      countQuery = countQuery.eq("user_id", user?.id)
    }

    const { count } = await countQuery

    return NextResponse.json({
      feedback,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Error in feedback API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user (optional for anonymous feedback)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = await request.json()
    const { rating, comment, email } = body

    // Validate required fields
    if (!rating) {
      return NextResponse.json(
        {
          error: "Rating is required",
        },
        { status: 400 },
      )
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          error: "Rating must be between 1 and 5",
        },
        { status: 400 },
      )
    }

    // For non-authenticated users, email is required
    if (!user && !email) {
      return NextResponse.json(
        {
          error: "Email is required for anonymous feedback",
        },
        { status: 400 },
      )
    }

    // Create feedback
    const { data: feedback, error } = await supabase
      .from("feedback")
      .insert({
        user_id: user?.id || null,
        rating: typeof rating === 'string' ? Number.parseInt(rating) : rating,
        comment: comment || null,
        email: user ? null : email, // Only store email for non-authenticated users
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating feedback:", error)
      return NextResponse.json({ error: error.message || "Failed to create feedback" }, { status: 500 })
    }

    return NextResponse.json({ feedback }, { status: 201 })
  } catch (error) {
    console.error("Error in feedback POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
