import { z } from "zod"
import { createClient } from "@/lib/utils/supabase/server"
import { requireOrgAdmin } from "@/lib/auth/require-org-admin"
import { getOrgDashboard } from "@/lib/services/organizations/org-dashboard.service"
import { errorResponse, handleApiError, successResponse } from "@/lib/api/error-handler"

// GET /api/org/[id] - org admin's scoped dashboard: org info, members with
// derived platform role (mentor/mentee), and aggregate summary.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params
    const guard = await requireOrgAdmin(organizationId)
    if (!guard.ok) return guard.response

    const supabase = await createClient()
    const dashboard = await getOrgDashboard(supabase, organizationId)

    if (!dashboard) {
      return errorResponse("Organização não encontrada", "NOT_FOUND", 404)
    }

    return successResponse(dashboard)
  } catch (error) {
    return handleApiError(error)
  }
}

const updateOrgSchema = z.object({
  join_policy: z.enum(["open", "invite_only"])
})

// PATCH /api/org/[id] - org admin updates settings (currently: join_policy)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params
    const guard = await requireOrgAdmin(organizationId)
    if (!guard.ok) return guard.response

    const validation = updateOrgSchema.safeParse(await request.json().catch(() => ({})))
    if (!validation.success) {
      return errorResponse(validation.error.errors[0]?.message || "Dados inválidos", "VALIDATION_ERROR", 400)
    }

    const supabase = await createClient()
    const { data: organization, error } = await supabase
      .from("organizations" as any)
      .update(validation.data as any)
      .eq("id", organizationId)
      .select()
      .single()

    if (error) throw error

    return successResponse(organization, "Organização atualizada")
  } catch (error) {
    return handleApiError(error)
  }
}
