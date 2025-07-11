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

    // Parse query parameters
    const status = searchParams.get("status")
    const userOnly = searchParams.get("user_only") === "true"

    let query = supabase
      .from("volunteer_activities")
      .select(`
        *,
        user:profiles(full_name, avatar_url),
        validator:profiles!volunteer_activities_validated_by_fkey(full_name)
      `)
      .order("created_at", { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq("status", status)
    }

    // If user_only is true, only show user's own activities (requires auth)
    if (userOnly) {
      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      query = query.eq("user_id", user.id)
    } else {
      // For public access, only show validated activities
      if (!user) {
        query = query.eq("status", "validated")
      } else {
        // For authenticated users, check their role
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        // Only admins and moderators can see all activities
        if (profile?.role !== "admin" && profile?.role !== "moderator") {
          query = query.eq("status", "validated")
        }
      }
    }

    const { data: activities, error } = await query

    if (error) {
      console.error("Error fetching activities:", error)
      return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
    }

    return NextResponse.json({ activities })
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
    const { title, activity_type, description, hours, date } = body

    // Validate required fields
    if (!title || !activity_type || !hours || !date) {
      return NextResponse.json(
        {
          error: "Missing required fields: title, activity_type, hours, date",
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
        title,
        activity_type,
        description,
        hours: Number.parseFloat(hours),
        date,
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
