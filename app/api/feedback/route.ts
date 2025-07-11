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

    // Get user profile to check role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single()

    // Parse query parameters
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    let query = supabase
      .from("feedback")
      .select(`
        *,
        user:profiles(full_name, avatar_url),
        responder:profiles!feedback_responded_by_fkey(full_name)
      `)
      .order("created_at", { ascending: false })

    // Apply filters based on user role
    if (profile?.role === "admin") {
      // Admins can see all feedback
      if (type) query = query.eq("type", type)
      if (status) query = query.eq("status", status)
    } else {
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

    if (profile?.role !== "admin") {
      countQuery = countQuery.eq("user_id", user?.id)
    } else {
      if (type) countQuery = countQuery.eq("type", type)
      if (status) countQuery = countQuery.eq("status", status)
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
    const { type, rating, title, message, page_url, is_anonymous = false } = body

    // Validate required fields
    if (!type || !title || !message) {
      return NextResponse.json(
        {
          error: "Missing required fields: type, title, message",
        },
        { status: 400 },
      )
    }

    // Validate type
    const validTypes = ["general", "bug", "feature", "mentor", "platform"]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          error: "Invalid type. Must be one of: " + validTypes.join(", "),
        },
        { status: 400 },
      )
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 10)) {
      return NextResponse.json(
        {
          error: "Rating must be between 1 and 10",
        },
        { status: 400 },
      )
    }

    // Create feedback
    const { data: feedback, error } = await supabase
      .from("feedback")
      .insert({
        user_id: is_anonymous ? null : user?.id,
        type,
        rating: rating ? Number.parseInt(rating) : null,
        title,
        message,
        page_url,
        user_agent: request.headers.get("user-agent"),
        is_anonymous,
        status: "open",
      })
      .select(`
        *,
        user:profiles(full_name, avatar_url)
      `)
      .single()

    if (error) {
      console.error("Error creating feedback:", error)
      return NextResponse.json({ error: "Failed to create feedback" }, { status: 500 })
    }

    return NextResponse.json({ feedback }, { status: 201 })
  } catch (error) {
    console.error("Error in feedback POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
