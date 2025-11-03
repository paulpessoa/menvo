import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { errorResponse, handleApiError } from "@/lib/api/error-handler"

// GET /api/organizations/[orgId]/reports/export - CSV export
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

    // Build query
    let query = supabase
      .from("appointments")
      .select(
        `
        *,
        mentor:mentor_id(full_name, email),
        mentee:mentee_id(full_name, email)
      `
      )
      .eq("organization_id", orgId)

    if (startDate) {
      query = query.gte("scheduled_at", startDate)
    }

    if (endDate) {
      query = query.lte("scheduled_at", endDate)
    }

    const { data: appointments, error } = await query.order("scheduled_at", {
      ascending: false
    })

    if (error) throw error

    // Generate CSV
    const csvHeaders = [
      "Data",
      "Mentor",
      "Email Mentor",
      "Mentee",
      "Email Mentee",
      "Duração (min)",
      "Status",
      "Tópicos"
    ]

    const csvRows = appointments?.map((appointment) => {
      const date = new Date(appointment.scheduled_at).toLocaleString("pt-BR")
      const mentorName = appointment.mentor?.full_name || "N/A"
      const mentorEmail = appointment.mentor?.email || "N/A"
      const menteeName = appointment.mentee?.full_name || "N/A"
      const menteeEmail = appointment.mentee?.email || "N/A"
      const duration = appointment.duration_minutes || "N/A"
      const status = appointment.status || "N/A"
      const topics = Array.isArray(appointment.topics)
        ? appointment.topics.join("; ")
        : "N/A"

      return [
        date,
        mentorName,
        mentorEmail,
        menteeName,
        menteeEmail,
        duration,
        status,
        topics
      ]
        .map((field) => `"${String(field).replace(/"/g, '""')}"`)
        .join(",")
    })

    const csvContent = [csvHeaders.join(","), ...(csvRows || [])].join("\n")

    // Set headers for file download
    const headers = new Headers()
    headers.set("Content-Type", "text/csv; charset=utf-8")
    headers.set(
      "Content-Disposition",
      `attachment; filename="mentorships-report-${orgId}-${
        new Date().toISOString().split("T")[0]
      }.csv"`
    )

    return new NextResponse(csvContent, { headers })
  } catch (error) {
    return handleApiError(error)
  }
}
