import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { isUserVolunteer } from "@/lib/volunteer-utils"

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

    const status = searchParams.get("status")
    const userOnly = searchParams.get("user_only") === "true"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // Check if user is volunteer/admin to see all activities
    const isVolunteer = await isUserVolunteer(user.id)

    let query = supabase
      .from("volunteer_activities")
      .select(`
        *,
        user:profiles!volunteer_activities_user_id_fkey(full_name, avatar_url),
        validator:profiles!volunteer_activities_validated_by_fkey(full_name)
      `)
      .order("created_at", { ascending: false })

    // Apply filters based on user permissions
    if (userOnly || !isVolunteer) {
      // Regular users can only see their own activities
      query = query.eq("user_id", user.id)
    }

    // Apply status filter
    if (status) {
      query = query.eq("status", status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: activities, error } = await query

    if (error) {
      console.error("Error fetching volunteer activities:", error)
      return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("volunteer_activities")
      .select("*", { count: "exact", head: true })

    if (userOnly || !isVolunteer) {
      countQuery = countQuery.eq("user_id", user.id)
    }

    if (status) {
      countQuery = countQuery.eq("status", status)
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
      isVolunteer,
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
    
    if (authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, activity_type, description, hours, date } = body

    // Validate required fields
    if (!title || !activity_type || !hours || !date) {
      return NextResponse.json(
        {
          error: "Title, activity type, hours, and date are required",
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

    // Validate activity type
    const validTypes = [
      'mentoria', 'workshop', 'palestra', 'codigo', 'design', 
      'marketing', 'administracao', 'suporte', 'traducao', 'outro'
    ]
    if (!validTypes.includes(activity_type)) {
      return NextResponse.json(
        {
          error: "Invalid activity type",
        },
        { status: 400 },
      )
    }

    // Create volunteer activity
    const { data: activity, error } = await supabase
      .from("volunteer_activities")
      .insert({
        user_id: user.id,
        title: title.trim(),
        activity_type,
        description: description?.trim() || null,
        hours: Number.parseFloat(hours),
        date,
        status: "pending",
      })
      .select(`
        *,
        user:profiles!volunteer_activities_user_id_fkey(full_name, avatar_url)
      `)
      .single()

    if (error) {
      console.error("Error creating volunteer activity:", error)
      return NextResponse.json({ error: "Failed to create activity" }, { status: 500 })
    }

    return NextResponse.json({ 
      activity,
      message: "Activity registered successfully. Awaiting validation."
    }, { status: 201 })
  } catch (error) {
    console.error("Error in volunteer activities POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}