import { NextRequest } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { assignOrgAdminSchema, orgIdParamSchema } from "@/lib/schemas/organizations"
import { errorResponse, successResponse } from "@/lib/api/error-handler"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { buildAdminOrganizationsService } from "@/lib/services/admin/ops.composition"

// POST /api/admin/organizations/[id]/admins - assign an existing user as org admin by email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const idCheck = orgIdParamSchema.safeParse((await params).id)
  if (!idCheck.success) return errorResponse("Organização inválida", "VALIDATION_ERROR", 400)
  const organizationId = idCheck.data
  const rawBody = await request.json().catch(() => ({}))
  const validation = assignOrgAdminSchema.safeParse(rawBody)

  if (!validation.success) {
    return errorResponse(
      validation.error.errors[0]?.message || "Dados inválidos",
      "VALIDATION_ERROR",
      400
    )
  }

  try {
    const service = buildAdminOrganizationsService(await createClient())
    const outcome = await service.assignOrgAdmin(organizationId, validation.data.email)
    if (outcome.kind === "no_account") {
      return errorResponse(
        "Nenhum usuário encontrado com esse e-mail. A pessoa precisa ter uma conta na Menvo primeiro.",
        "NOT_FOUND",
        404
      )
    }
    return successResponse(
      { organizationId, userId: outcome.userId },
      "Admin da organização atribuído"
    )
  } catch (error) {
    const forbidden = adminForbiddenResponse(error)
    if (forbidden) return forbidden
    console.error("[POST /api/admin/organizations/[id]/admins] Error:", error)
    return errorResponse("Erro interno do servidor", "INTERNAL_ERROR", 500)
  }
}
