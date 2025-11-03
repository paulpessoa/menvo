import { createClient } from "@/utils/supabase/server"
import { createServiceRoleClient } from "@/utils/supabase/service-role"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"
import type { Organization } from "@/types/organizations"

// POST /api/organizations/[orgId]/approve - Approve organization
export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient()
    const serviceSupabase = createServiceRoleClient()
    const { orgId } = params

    // Authenticate user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    // Check if user is platform admin
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", user.id)

    const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === "admin")
    if (!isAdmin) {
      return errorResponse(
        "Forbidden - Platform admin access required",
        "FORBIDDEN",
        403
      )
    }

    // Update organization status
    const { data: organization, error: updateError } = await serviceSupabase
      .from("organizations")
      .update({
        status: "active",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", orgId)
      .select()
      .single()

    if (updateError) throw updateError

    // Log activity
    await serviceSupabase.from("organization_activity_log").insert({
      organization_id: orgId,
      activity_type: "organization_approved",
      actor_id: user.id
    })

    // TODO: Send approval email to organization admin

    return successResponse(
      organization as Organization,
      "Organization approved successfully"
    )
  } catch (error) {
    return handleApiError(error)
  }
}
