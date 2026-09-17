import { NextRequest } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { updateOrganizationStatusSchema } from "@/lib/schemas/organizations"
import { errorResponse, handleApiError, successResponse } from "@/lib/api/error-handler"

// PATCH /api/admin/organizations/[id] - suspend/reactivate an organization
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params
    const rawBody = await request.json().catch(() => ({}))
    const validation = updateOrganizationStatusSchema.safeParse(rawBody)

    if (!validation.success) {
      return errorResponse(
        validation.error.errors[0]?.message || "Dados inválidos",
        "VALIDATION_ERROR",
        400
      )
    }

    const supabase = await createClient()

    const { data: organization, error } = await supabase
      .from("organizations" as any)
      .update({ status: validation.data.status } as any)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return successResponse(organization, "Organização atualizada")
  } catch (error) {
    return handleApiError(error)
  }
}
