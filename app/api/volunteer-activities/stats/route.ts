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
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single()

    const userId = searchParams.get("user_id")
    const isAdmin = profile?.role === "admin"
    const isPersonalView = userId === user!.id

    // Build base query
    let baseQuery = supabase.from("volunteer_activities").select("*")

    if (!isAdmin) {
      if (isPersonalView) {
        baseQuery = baseQuery.eq("user_id", user!.id)
      } else {
        baseQuery = baseQuery.eq("status", "validated")
        if (userId) {
          baseQuery = baseQuery.eq("user_id", userId)
        }
      }
    } else if (userId) {
      baseQuery = baseQuery.eq("user_id", userId)
    }

    const { data: allActivities, error: activitiesError } = await baseQuery

    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError)
      return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
    }

    // Calculate stats from the data
    const totalActivities = allActivities?.length || 0
    const totalHours = allActivities?.reduce((sum, activity) => sum + Number(activity.hours), 0) || 0
    const validatedActivities = allActivities?.filter(activity => activity.status === "validated").length || 0
    const pendingActivities = allActivities?.filter(activity => activity.status === "pending").length || 0
    const rejectedActivities = allActivities?.filter(activity => activity.status === "rejected").length || 0

    // Calculate last 30 days stats
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const activitiesLast30Days = allActivities?.filter(activity => new Date(activity.date) >= thirtyDaysAgo).length || 0
    const hoursLast30Days = allActivities
      ?.filter(activity => new Date(activity.date) >= thirtyDaysAgo)
      .reduce((sum, activity) => sum + Number(activity.hours), 0) || 0

    // Calculate last 7 days stats
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const activitiesLast7Days = allActivities?.filter(activity => new Date(activity.date) >= sevenDaysAgo).length || 0
    const hoursLast7Days = allActivities
      ?.filter(activity => new Date(activity.date) >= sevenDaysAgo)
      .reduce((sum, activity) => sum + Number(activity.hours), 0) || 0

    // Get activities by type
    const activitiesByType = allActivities?.reduce((acc, activity) => {
      const type = activity.title || "Outro"
      const existing = acc.find((item: any) => item.type === type)
      if (existing) {
        existing.hours += Number(activity.hours)
        existing.count += 1
      } else {
        acc.push({ type, hours: Number(activity.hours), count: 1 })
      }
      return acc
    }, [] as any[]) || []

    // Get hours by status
    const hoursByStatus = allActivities?.reduce((acc, activity) => {
      const existing = acc.find((item: any) => item.status === activity.status)
      if (existing) {
        existing.total_hours += Number(activity.hours)
        existing.count += 1
      } else {
        acc.push({ status: activity.status, total_hours: Number(activity.hours), count: 1 })
      }
      return acc
    }, [] as any[]) || []

    return NextResponse.json({
      total_activities: totalActivities,
      total_volunteers: new Set(allActivities?.map(a => a.user_id) || []).size,
      total_hours: totalHours,
      avg_hours_per_activity: totalActivities > 0 ? totalHours / totalActivities : 0,
      validated_activities: validatedActivities,
      pending_activities: pendingActivities,
      rejected_activities: rejectedActivities,
      activities_last_30_days: activitiesLast30Days,
      hours_last_30_days: hoursLast30Days,
      activities_last_7_days: activitiesLast7Days,
      hours_last_7_days: hoursLast7Days,
      activities_by_type: activitiesByType,
      hours_by_status: hoursByStatus,
    })
  } catch (error) {
    console.error("Error in volunteer activities stats API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
