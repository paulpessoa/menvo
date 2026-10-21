import { NextRequest } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createOrganizationSchema } from "@/lib/schemas/organizations"
import { errorResponse, successResponse } from "@/lib/api/error-handler"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { buildAdminOrganizationsService } from "@/lib/services/admin/ops.composition"

/** Traduz o erro do service; erro de banco não vaza a mensagem do driver. */
function failure(error: unknown, context: string) {
  const forbidden = adminForbiddenResponse(error)
  if (forbidden) return forbidden
  console.error(`[${context}] Error:`, error)
  return errorResponse("Erro interno do servidor", "INTERNAL_ERROR", 500)
}

// GET /api/admin/organizations - list every organization (platform admin only)
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  try {
    const service = buildAdminOrganizationsService(await createClient())
    return successResponse(await service.listOrganizations())
  } catch (error) {
    return failure(error, "GET /api/admin/organizations")
  }
}

// POST /api/admin/organizations - create a new organization (platform admin only)
export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const rawBody = await request.json().catch(() => ({}))
  const validation = createOrganizationSchema.safeParse(rawBody)

  if (!validation.success) {
    return errorResponse(
      validation.error.errors[0]?.message || "Dados inválidos",
      "VALIDATION_ERROR",
      400
    )
  }

  try {
    const service = buildAdminOrganizationsService(await createClient())
    const outcome = await service.createOrganization(validation.data)
    if (outcome.kind === "slug_taken") {
      return errorResponse("Já existe uma organização com esse slug", "CONFLICT", 409)
    }
    return successResponse(outcome.organization, "Organização criada com sucesso")
  } catch (error) {
    return failure(error, "POST /api/admin/organizations")
  }
}
