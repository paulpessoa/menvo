import { createClient } from "@/utils/supabase/server"
import { createServiceRoleClient } from "@/utils/supabase/service-role"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

// POST /api/admin/organizations/[id]/suspend - Suspend organization (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const serviceSupabase = createServiceRoleClient()
    const { id } = params

    // Authenticate user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id)
      .single()

    const userRole = (roleData?.roles as any)?.name
    if (userRole !== "admin" && userRole !== "moderator") {
      return errorResponse(
        "Forbidden - Admin access required",
        "FORBIDDEN",
        403
      )
    }

    // Update organization status to suspended
    const { data: organization, error: updateError } = await serviceSupabase
      .from("organizations")
      .update({ status: "suspended" })
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    // Log activity
    await serviceSupabase.from("organization_activity_log").insert({
      organization_id: id,
      activity_type: "settings_updated",
      actor_id: user.id,
      metadata: { action: "suspended", suspended_by: user.id }
    })

    return successResponse(organization, "Organization suspended successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
