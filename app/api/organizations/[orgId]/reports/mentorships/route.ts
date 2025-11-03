import { createClient } from "@/utils/supabase/server"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

// GET /api/organizations/[orgId]/reports/mentorships - Mentorship report
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient()
    const { orgId } = params
    const searchParams = request.nextUrl.searchParams

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

    // Get query parameters
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const status = searchParams.get("status")

    // Build query
    let query = supabase
      .from("appointments")
      .select(
        `
        *,
        mentor:mentor_id(id, full_name, email),
        mentee:mentee_id(id, full_name, email)
      `
      )
      .eq("organization_id", orgId)

    if (startDate) {
      query = query.gte("scheduled_at", startDate)
    }

    if (endDate) {
      query = query.lte("scheduled_at", endDate)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data: appointments, error } = await query.order("scheduled_at", {
      ascending: false
    })

    if (error) throw error

    // Calculate aggregated metrics
    const totalAppointments = appointments?.length || 0
    const completedAppointments =
      appointments?.filter((a) => a.status === "completed").length || 0
    const cancelledAppointments =
      appointments?.filter((a) => a.status === "cancelled").length || 0
    const pendingAppointments =
      appointments?.filter((a) => a.status === "pending").length || 0

    const completionRate =
      totalAppointments > 0
        ? Math.round((completedAppointments / totalAppointments) * 100)
        : 0

    // Calculate average duration (in minutes)
    const appointmentsWithDuration = appointments?.filter(
      (a) => a.duration_minutes
    )
    const avgDuration =
      appointmentsWithDuration && appointmentsWithDuration.length > 0
        ? Math.round(
            appointmentsWithDuration.reduce(
              (sum, a) => sum + (a.duration_minutes || 0),
              0
            ) / appointmentsWithDuration.length
          )
        : 0

    // Topic distribution
    const topicCounts: Record<string, number> = {}
    appointments?.forEach((appointment) => {
      if (appointment.topics && Array.isArray(appointment.topics)) {
        appointment.topics.forEach((topic: string) => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1
        })
      }
    })

    const topicDistribution = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([topic, count]) => ({
        topic,
        count,
        percentage:
          totalAppointments > 0
            ? Math.round((count / totalAppointments) * 100)
            : 0
      }))

    // Mentor activity
    const mentorActivity: Record<
      string,
      { name: string; appointments: number; completed: number }
    > = {}

    appointments?.forEach((appointment) => {
      const mentorId = appointment.mentor_id
      if (!mentorActivity[mentorId]) {
        mentorActivity[mentorId] = {
          name: appointment.mentor?.full_name || "Unknown",
          appointments: 0,
          completed: 0
        }
      }
      mentorActivity[mentorId].appointments++
      if (appointment.status === "completed") {
        mentorActivity[mentorId].completed++
      }
    })

    const topMentors = Object.entries(mentorActivity)
      .sort(([, a], [, b]) => b.appointments - a.appointments)
      .slice(0, 10)
      .map(([id, data]) => ({
        mentorId: id,
        ...data,
        completionRate:
          data.appointments > 0
            ? Math.round((data.completed / data.appointments) * 100)
            : 0
      }))

    // Appointments over time (grouped by week)
    const appointmentsByWeek: Record<string, number> = {}
    appointments?.forEach((appointment) => {
      const date = new Date(appointment.scheduled_at)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().split("T")[0]
      appointmentsByWeek[weekKey] = (appointmentsByWeek[weekKey] || 0) + 1
    })

    const timeSeriesData = Object.entries(appointmentsByWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, count]) => ({ week, count }))

    const report = {
      summary: {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        pendingAppointments,
        completionRate,
        avgDuration
      },
      topicDistribution,
      topMentors,
      timeSeriesData
    }

    return successResponse(report)
  } catch (error) {
    return handleApiError(error)
  }
}
