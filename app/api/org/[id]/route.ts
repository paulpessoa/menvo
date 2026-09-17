import { createClient } from "@/lib/utils/supabase/server"
import { requireOrgAdmin } from "@/lib/auth/require-org-admin"
import { errorResponse, handleApiError, successResponse } from "@/lib/api/error-handler"

// GET /api/org/[id] - org admin's scoped dashboard: org info + beneficiary list
// with basic stats (quiz done, sessions booked). Read-only for Phase 1.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params
    const guard = await requireOrgAdmin(organizationId)
    if (!guard.ok) return guard.response

    const supabase = await createClient()

    const { data: organization, error: orgError } = await supabase
      .from("organizations" as any)
      .select("*")
      .eq("id", organizationId)
      .maybeSingle()

    if (orgError) throw orgError
    if (!organization) {
      return errorResponse("Organização não encontrada", "NOT_FOUND", 404)
    }

    const { data: members, error: membersError } = await supabase
      .from("organization_members" as any)
      .select("user_id, role, created_at, profiles(id, full_name, email)")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })

    if (membersError) throw membersError

    const memberRows = (members ?? []) as any[]
    const memberIds = memberRows.map(m => m.user_id)
    const memberEmails = memberRows
      .map(m => m.profiles?.email)
      .filter((email): email is string => Boolean(email))

    const [{ data: appointments }, { data: quizzes }] = await Promise.all([
      memberIds.length
        ? supabase
            .from("appointments")
            .select("mentee_id")
            .in("mentee_id", memberIds)
        : Promise.resolve({ data: [] as { mentee_id: string }[] }),
      memberEmails.length
        ? supabase
            .from("quiz_responses" as any)
            .select("email")
            .in("email", memberEmails)
        : Promise.resolve({ data: [] as { email: string }[] })
    ])

    const appointmentCountByMentee = new Map<string, number>()
    for (const appt of (appointments ?? []) as { mentee_id: string }[]) {
      appointmentCountByMentee.set(
        appt.mentee_id,
        (appointmentCountByMentee.get(appt.mentee_id) ?? 0) + 1
      )
    }
    const quizEmailSet = new Set(((quizzes ?? []) as { email: string }[]).map(q => q.email))

    const beneficiaries = memberRows.map(m => ({
      userId: m.user_id,
      role: m.role,
      joinedAt: m.created_at,
      fullName: m.profiles?.full_name ?? null,
      email: m.profiles?.email ?? null,
      sessionsBooked: appointmentCountByMentee.get(m.user_id) ?? 0,
      quizDone: m.profiles?.email ? quizEmailSet.has(m.profiles.email) : false
    }))

    return successResponse({ organization, members: beneficiaries })
  } catch (error) {
    return handleApiError(error)
  }
}
