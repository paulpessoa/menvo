import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("user_role").eq("id", user.id).single()

    if (profile?.user_role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { status, validation_notes } = body

    // Validate status
    if (!["validated", "rejected"].includes(status)) {
      return NextResponse.json(
        {
          error: 'Invalid status. Must be "validated" or "rejected"',
        },
        { status: 400 },
      )
    }

    // Update activity
    const { data: activity, error } = await supabase
      .from("volunteer_activities")
      .update({
        status,
        validation_notes,
        validated_by: user.id,
        validated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select(`
        *,
        activity_type:volunteer_activity_types(name, icon, color),
        user:profiles(full_name, avatar_url, email),
        validator:profiles!volunteer_activities_validated_by_fkey(full_name)
      `)
      .single()

    if (error) {
      console.error("Error validating activity:", error)
      return NextResponse.json({ error: "Failed to validate activity" }, { status: 500 })
    }

    // TODO: Send notification email to user about validation result
    // This would integrate with your email service (Brevo, etc.)

    return NextResponse.json({ activity })
  } catch (error) {
    console.error("Error in activity validation API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
