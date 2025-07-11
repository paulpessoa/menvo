import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
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

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Get feedback by type
    const { data: feedbackByType, error: typeError } = await supabase
      .from("feedback")
      .select("type")
      .then(({ data, error }) => {
        if (error) return { data: null, error }

        const counts = data?.reduce((acc: any, item) => {
          acc[item.type] = (acc[item.type] || 0) + 1
          return acc
        }, {})

        return {
          data: Object.entries(counts || {}).map(([type, count]) => ({ type, count })),
          error: null,
        }
      })

    // Get feedback by status
    const { data: feedbackByStatus, error: statusError } = await supabase
      .from("feedback")
      .select("status")
      .then(({ data, error }) => {
        if (error) return { data: null, error }

        const counts = data?.reduce((acc: any, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1
          return acc
        }, {})

        return {
          data: Object.entries(counts || {}).map(([status, count]) => ({ status, count })),
          error: null,
        }
      })

    // Get average rating by type
    const { data: ratingsByType, error: ratingError } = await supabase
      .from("feedback")
      .select("type, rating")
      .not("rating", "is", null)
      .then(({ data, error }) => {
        if (error) return { data: null, error }

        const grouped = data?.reduce((acc: any, item) => {
          if (!acc[item.type]) {
            acc[item.type] = { ratings: [], count: 0 }
          }
          acc[item.type].ratings.push(item.rating)
          acc[item.type].count++
          return acc
        }, {})

        const averages = Object.entries(grouped || {}).map(([type, data]: [string, any]) => ({
          type,
          average_rating: data.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / data.count,
          count: data.count,
        }))

        return { data: averages, error: null }
      })

    // Get monthly feedback trends
    const { data: monthlyTrends, error: trendsError } = await supabase
      .from("feedback")
      .select("created_at, rating")
      .gte("created_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .then(({ data, error }) => {
        if (error) return { data: null, error }

        const monthly = data?.reduce((acc: any, item) => {
          const month = new Date(item.created_at).toISOString().slice(0, 7) // YYYY-MM
          if (!acc[month]) {
            acc[month] = { count: 0, ratings: [] }
          }
          acc[month].count++
          if (item.rating) {
            acc[month].ratings.push(item.rating)
          }
          return acc
        }, {})

        const trends = Object.entries(monthly || {})
          .map(([month, data]: [string, any]) => ({
            month,
            count: data.count,
            average_rating:
              data.ratings.length > 0
                ? data.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / data.ratings.length
                : null,
          }))
          .sort((a, b) => a.month.localeCompare(b.month))

        return { data: trends, error: null }
      })

    // Calculate NPS (Net Promoter Score) - assuming rating 1-10 scale
    const { data: npsData, error: npsError } = await supabase
      .from("feedback")
      .select("rating")
      .not("rating", "is", null)
      .then(({ data, error }) => {
        if (error) return { data: null, error }

        const ratings = data?.map((item) => item.rating) || []
        const promoters = ratings.filter((r) => r >= 9).length
        const detractors = ratings.filter((r) => r <= 6).length
        const total = ratings.length

        const nps = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0

        return {
          data: {
            nps,
            promoters,
            passives: total - promoters - detractors,
            detractors,
            total,
          },
          error: null,
        }
      })

    // Get recent feedback
    const { data: recentFeedback, error: recentError } = await supabase
      .from("feedback")
      .select(`
        id,
        type,
        title,
        rating,
        created_at,
        status,
        user:profiles(full_name, avatar_url)
      `)
      .order("created_at", { ascending: false })
      .limit(10)

    if (typeError || statusError || ratingError || trendsError || npsError || recentError) {
      console.error("Error fetching feedback stats:", {
        typeError,
        statusError,
        ratingError,
        trendsError,
        npsError,
        recentError,
      })
    }

    return NextResponse.json({
      feedbackByType: feedbackByType || [],
      feedbackByStatus: feedbackByStatus || [],
      ratingsByType: ratingsByType || [],
      monthlyTrends: monthlyTrends || [],
      nps: npsData || { nps: 0, promoters: 0, passives: 0, detractors: 0, total: 0 },
      recentFeedback: recentFeedback || [],
    })
  } catch (error) {
    console.error("Error in feedback stats API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
