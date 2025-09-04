import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get total statistics
    const { data: totalStats, error: totalError } = await supabase
      .from("volunteer_activities")
      .select("hours, user_id")
      .eq("status", "validated")

    if (totalError) {
      console.error("Error fetching total stats:", totalError)
      return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
    }

    // Calculate basic stats
    const totalActivities = totalStats.length
    const totalHours = totalStats.reduce((sum, activity) => sum + Number(activity.hours), 0)
    const uniqueVolunteers = new Set(totalStats.map(activity => activity.user_id)).size

    // Get activities by type
    const { data: typeStats, error: typeError } = await supabase
      .from("volunteer_activities")
      .select("activity_type, hours")
      .eq("status", "validated")

    if (typeError) {
      console.error("Error fetching type stats:", typeError)
      return NextResponse.json({ error: "Failed to fetch type statistics" }, { status: 500 })
    }

    // Group by activity type
    const activitiesByType = typeStats.reduce((acc: any, activity) => {
      const type = activity.activity_type
      if (!acc[type]) {
        acc[type] = { activity_type: type, count: 0, total_hours: 0 }
      }
      acc[type].count += 1
      acc[type].total_hours += Number(activity.hours)
      return acc
    }, {})

    // Get monthly statistics (last 12 months)
    const { data: monthlyStats, error: monthlyError } = await supabase
      .rpc('get_monthly_volunteer_stats')

    let monthlyData = []
    if (monthlyError) {
      console.warn("Monthly stats function not available, using fallback")
      // Fallback: get data and group by month in JavaScript
      const { data: allActivities } = await supabase
        .from("volunteer_activities")
        .select("date, hours")
        .eq("status", "validated")
        .gte("date", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (allActivities) {
        const monthlyGroups: any = {}
        allActivities.forEach(activity => {
          const date = new Date(activity.date)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          
          if (!monthlyGroups[monthKey]) {
            monthlyGroups[monthKey] = { month: monthName, activities: 0, hours: 0 }
          }
          monthlyGroups[monthKey].activities += 1
          monthlyGroups[monthKey].hours += Number(activity.hours)
        })

        monthlyData = Object.values(monthlyGroups).slice(-12)
      }
    } else {
      monthlyData = monthlyStats || []
    }

    // Get top volunteers (public leaderboard)
    const { data: topVolunteers, error: leaderboardError } = await supabase
      .from("volunteer_activities")
      .select(`
        user_id,
        hours,
        user:profiles!volunteer_activities_user_id_fkey(full_name, avatar_url)
      `)
      .eq("status", "validated")

    let leaderboard = []
    if (!leaderboardError && topVolunteers) {
      // Group by user and calculate totals
      const userStats: any = {}
      topVolunteers.forEach(activity => {
        const userId = activity.user_id
        if (!userStats[userId]) {
          userStats[userId] = {
            user_id: userId,
            full_name: activity.user?.full_name || 'Usuário',
            avatar_url: activity.user?.avatar_url,
            total_hours: 0,
            activities_count: 0
          }
        }
        userStats[userId].total_hours += Number(activity.hours)
        userStats[userId].activities_count += 1
      })

      // Sort by hours and take top 10
      leaderboard = Object.values(userStats)
        .sort((a: any, b: any) => b.total_hours - a.total_hours)
        .slice(0, 10)
    }

    return NextResponse.json({
      total_activities: totalActivities,
      total_volunteers: uniqueVolunteers,
      total_hours: Math.round(totalHours * 100) / 100,
      validated_activities: totalActivities,
      pending_activities: 0, // We'll calculate this separately if needed
      rejected_activities: 0, // We'll calculate this separately if needed
      activities_by_type: Object.values(activitiesByType),
      monthly_stats: monthlyData,
      leaderboard,
      impact_metrics: {
        avg_hours_per_volunteer: uniqueVolunteers > 0 ? Math.round((totalHours / uniqueVolunteers) * 100) / 100 : 0,
        avg_hours_per_activity: totalActivities > 0 ? Math.round((totalHours / totalActivities) * 100) / 100 : 0,
        most_popular_activity: Object.values(activitiesByType).length > 0 
          ? Object.values(activitiesByType).sort((a: any, b: any) => b.count - a.count)[0]
          : null
      }
    })
  } catch (error) {
    console.error("Error in volunteer stats API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}