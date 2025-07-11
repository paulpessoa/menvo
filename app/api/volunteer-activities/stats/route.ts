import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get only validated activities for public stats
    const { data: activities, error } = await supabase
      .from("volunteer_activities")
      .select("*")
      .eq("status", "validated")

    if (error) {
      console.error("Error fetching activities for stats:", error)
      return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
    }

    // Calculate statistics
    const totalActivities = activities.length
    const totalHours = activities.reduce((sum, activity) => sum + activity.hours, 0)

    // Get unique volunteers count
    const uniqueVolunteers = new Set(activities.map((activity) => activity.user_id)).size

    // Group by activity type
    const activitiesByType = activities.reduce((acc: any, activity) => {
      const type = activity.activity_type
      if (!acc[type]) {
        acc[type] = { activity_type: type, count: 0, total_hours: 0 }
      }
      acc[type].count += 1
      acc[type].total_hours += activity.hours
      return acc
    }, {})

    // Group by month
    const monthlyStats = activities.reduce((acc: any, activity) => {
      const date = new Date(activity.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthName = date.toLocaleDateString("pt-BR", { year: "numeric", month: "long" })

      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthName, activities: 0, hours: 0 }
      }
      acc[monthKey].activities += 1
      acc[monthKey].hours += activity.hours
      return acc
    }, {})

    const stats = {
      total_activities: totalActivities,
      total_volunteers: uniqueVolunteers,
      total_hours: Math.round(totalHours * 10) / 10,
      validated_activities: totalActivities,
      pending_activities: 0, // Not shown in public stats
      rejected_activities: 0, // Not shown in public stats
      activities_by_type: Object.values(activitiesByType),
      monthly_stats: Object.values(monthlyStats).sort((a: any, b: any) => a.month.localeCompare(b.month)),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error in volunteer stats API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
