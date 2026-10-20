import { NextRequest } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { orgIdParamSchema, updateOrganizationStatusSchema } from "@/lib/schemas/organizations"
import { errorResponse, successResponse } from "@/lib/api/error-handler"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { buildAdminOrganizationsService } from "@/lib/services/admin/ops.composition"

// PATCH /api/admin/organizations/[id] - suspend/reactivate an organization
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const idCheck = orgIdParamSchema.safeParse((await params).id)
  if (!idCheck.success) return errorResponse("Organização inválida", "VALIDATION_ERROR", 400)
  const id = idCheck.data
  const rawBody = await request.json().catch(() => ({}))
  const validation = updateOrganizationStatusSchema.safeParse(rawBody)

  if (!validation.success) {
    return errorResponse(
      validation.error.errors[0]?.message || "Dados inválidos",
      "VALIDATION_ERROR",
      400
    )
  }

  try {
    const service = buildAdminOrganizationsService(await createClient())
    const organization = await service.setOrganizationStatus(id, validation.data.status)
    if (!organization) return errorResponse("Organização não encontrada", "NOT_FOUND", 404)
    return successResponse(organization, "Organização atualizada")
  } catch (error) {
    const forbidden = adminForbiddenResponse(error)
    if (forbidden) return forbidden
    console.error("[PATCH /api/admin/organizations/[id]] Error:", error)
    return errorResponse("Erro interno do servidor", "INTERNAL_ERROR", 500)
  }
}
