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
    const userId = searchParams.get("user_id")
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    let query = supabase
      .from("volunteer_activities")
      .select(`
        *,
        activity_type:volunteer_activity_types(name, icon, color),
        user:profiles(full_name, avatar_url),
        validator:profiles!volunteer_activities_validated_by_fkey(full_name)
      `)
      .order("created_at", { ascending: false })

    // Apply filters based on user role and permissions
    if (profile?.role === "admin") {
      // Admins can see all activities
      if (userId) query = query.eq("user_id", userId)
      if (status) query = query.eq("status", status)
    } else {
      // Regular users can only see their own activities or validated public ones
      if (userId && userId === user?.id) {
        // User viewing their own activities
        query = query.eq("user_id", user?.id)
      } else {
        // Public view - only validated activities
        query = query.eq("status", "validated")
        if (userId) query = query.eq("user_id", userId)
      }
    }

    if (type) {
      query = query.eq("activity_type.name", type)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: activities, error } = await query

    if (error) {
      console.error("Error fetching activities:", error)
      return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase.from("volunteer_activities").select("*", { count: "exact", head: true })

    if (profile?.role !== "admin") {
      if (userId && userId === user?.id) {
        countQuery = countQuery.eq("user_id", user?.id)
      } else {
        countQuery = countQuery.eq("status", "validated")
        if (userId) countQuery = countQuery.eq("user_id", userId)
      }
    } else {
      if (userId) countQuery = countQuery.eq("user_id", userId)
      if (status) countQuery = countQuery.eq("status", status)
    }

    const { count } = await countQuery

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Error in volunteer activities API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { activity_type_id, title, description, hours, date, location, organization, evidence_url } = body

    // Validate required fields
    if (!title || !hours || !date) {
      return NextResponse.json(
        {
          error: "Missing required fields: title, hours, date",
        },
        { status: 400 },
      )
    }

    // Validate hours
    if (hours <= 0 || hours > 24) {
      return NextResponse.json(
        {
          error: "Hours must be between 0.1 and 24",
        },
        { status: 400 },
      )
    }

    // Create activity
    const { data: activity, error } = await supabase
      .from("volunteer_activities")
      .insert({
        user_id: user.id,
        activity_type_id,
        title,
        description,
        hours: Number.parseFloat(hours),
        date,
        location,
        organization,
        evidence_url,
        status: "pending",
      })
      .select("*")
      .single()

    if (error) {
      console.error("Error creating activity:", error)
      return NextResponse.json({ error: "Failed to create activity" }, { status: 500 })
    }

    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    console.error("Error in volunteer activities POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
