import { createClient } from "@/lib/utils/supabase/server"
import { requireOrgAdmin } from "@/lib/auth/require-org-admin"
import { orgIdParamSchema, orgPeriodSchema, updateOrgSettingsSchema } from "@/lib/schemas/organizations"
import { getOrgDashboard } from "@/lib/services/organizations/org-dashboard.service"
import { buildOrgAdminService } from "@/lib/services/organizations/org-admin.composition"
import { errorResponse, handleApiError, successResponse } from "@/lib/api/error-handler"

// GET /api/org/[id] - org admin's scoped dashboard: org info, members with
// derived platform role (mentor/mentee), and aggregate summary.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const idCheck = orgIdParamSchema.safeParse((await params).id)
    if (!idCheck.success) return errorResponse("Organização inválida", "VALIDATION_ERROR", 400)
    const organizationId = idCheck.data

    const guard = await requireOrgAdmin(organizationId)
    if (!guard.ok) return guard.response

    // Unknown ?period= values fall back to "all" (same as before).
    const period = orgPeriodSchema.parse(new URL(request.url).searchParams.get("period"))

    const supabase = await createClient()
    const dashboard = await getOrgDashboard(supabase, organizationId, period)

    if (!dashboard) {
      return errorResponse("Organização não encontrada", "NOT_FOUND", 404)
    }

    return successResponse(dashboard)
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/org/[id] - org admin updates settings (currently: join_policy)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const idCheck = orgIdParamSchema.safeParse((await params).id)
    if (!idCheck.success) return errorResponse("Organização inválida", "VALIDATION_ERROR", 400)
    const organizationId = idCheck.data

    const guard = await requireOrgAdmin(organizationId)
    if (!guard.ok) return guard.response

    const validation = updateOrgSettingsSchema.safeParse(await request.json().catch(() => ({})))
    if (!validation.success) {
      return errorResponse(validation.error.errors[0]?.message || "Dados inválidos", "VALIDATION_ERROR", 400)
    }

    const organization = await buildOrgAdminService(await createClient()).updateJoinPolicy(
      organizationId,
      validation.data.join_policy
    )

    return successResponse(organization, "Organização atualizada")
  } catch (error) {
    return handleApiError(error)
  }
}
