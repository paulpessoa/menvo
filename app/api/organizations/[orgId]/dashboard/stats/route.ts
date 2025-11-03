import { createClient } from "@/utils/supabase/server"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000
let statsCache: Map<string, { data: any; timestamp: number }> = new Map()

// GET /api/organizations/[orgId]/dashboard/stats - Organization metrics
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient()
    const { orgId } = params

    // Authenticate user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    // Check if user is org admin
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role, status")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .single()

    if (
      !membership ||
      membership.role !== "admin" ||
      membership.status !== "active"
    ) {
      return errorResponse("Forbidden", "FORBIDDEN", 403)
    }

    // Check cache
    const cached = statsCache.get(orgId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return successResponse(cached.data)
    }

    // Calculate metrics
    // 1. Total mentors and mentees
    const { data: mentors, count: mentorCount } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("role", "mentor")
      .eq("status", "active")

    const { data: mentees, count: menteeCount } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("role", "mentee")
      .eq("status", "active")

    // 2. Monthly appointments (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: appointments, count: appointmentCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact" })
      .eq("organization_id", orgId)
      .gte("scheduled_at", thirtyDaysAgo.toISOString())

    // 3. Completion rate
    const { count: completedCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "completed")
      .gte("scheduled_at", thirtyDaysAgo.toISOString())

    const completionRate =
      appointmentCount && appointmentCount > 0
        ? Math.round(((completedCount || 0) / appointmentCount) * 100)
        : 0

    // 4. Top topics
    const topicsData = await supabase
      .from("appointments")
      .select("topics")
      .eq("organization_id", orgId)
      .not("topics", "is", null)
      .gte("scheduled_at", thirtyDaysAgo.toISOString())

    const topicCounts: Record<string, number> = {}
    topicsData.data?.forEach((appointment) => {
      if (appointment.topics && Array.isArray(appointment.topics)) {
        appointment.topics.forEach((topic: string) => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1
        })
      }
    })

    const topTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }))

    // 5. Active mentors (with appointments in last 30 days)
    const { data: activeMentorIds } = await supabase
      .from("appointments")
      .select("mentor_id")
      .eq("organization_id", orgId)
      .gte("scheduled_at", thirtyDaysAgo.toISOString())

    const uniqueActiveMentors = new Set(
      activeMentorIds?.map((a) => a.mentor_id) || []
    )

    const stats = {
      totalMentors: mentorCount || 0,
      totalMentees: menteeCount || 0,
      monthlyAppointments: appointmentCount || 0,
      completionRate,
      topTopics,
      activeMentors: uniqueActiveMentors.size
    }

    // Update cache
    statsCache.set(orgId, { data: stats, timestamp: Date.now() })

    return successResponse(stats)
  } catch (error) {
    return handleApiError(error)
  }
}
