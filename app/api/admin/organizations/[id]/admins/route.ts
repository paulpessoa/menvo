import { NextRequest } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { assignOrgAdminSchema } from "@/lib/schemas/organizations"
import { errorResponse, handleApiError, successResponse } from "@/lib/api/error-handler"

// POST /api/admin/organizations/[id]/admins - assign an existing user as org admin by email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id: organizationId } = await params
    const rawBody = await request.json().catch(() => ({}))
    const validation = assignOrgAdminSchema.safeParse(rawBody)

    if (!validation.success) {
      return errorResponse(
        validation.error.errors[0]?.message || "Dados inválidos",
        "VALIDATION_ERROR",
        400
      )
    }

    const supabase = await createClient()

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", validation.data.email)
      .maybeSingle()

    if (!profile) {
      return errorResponse(
        "Nenhum usuário encontrado com esse e-mail. A pessoa precisa ter uma conta na Menvo primeiro.",
        "NOT_FOUND",
        404
      )
    }

    const { data: existingMembership } = await supabase
      .from("organization_members" as any)
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", profile.id)
      .maybeSingle()

    if (existingMembership) {
      const { error: updateError } = await supabase
        .from("organization_members" as any)
        .update({ role: "admin" } as any)
        .eq("organization_id", organizationId)
        .eq("user_id", profile.id)

      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabase
        .from("organization_members" as any)
        .insert({ organization_id: organizationId, user_id: profile.id, role: "admin" } as any)

      if (insertError) throw insertError
    }

    return successResponse({ organizationId, userId: profile.id }, "Admin da organização atribuído")
  } catch (error) {
    return handleApiError(error)
  }
}
