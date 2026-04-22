import { createClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

// PATCH /api/admin/organizations/[id]/status - Update organization status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const serviceSupabase = createServiceRoleClient()
    const { id } = await params
    const { status } = await request.json()

    if (!status) {
      return errorResponse("Status is required", "BAD_REQUEST", 400)
    }

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

    const updateData: any = { status }
    
    // Se for aprovação, registrar data e autor
    if (status === 'active') {
        updateData.approved_at = new Date().toISOString()
        updateData.approved_by = user.id
    }

    // Update organization status
    const { data: organization, error: updateError } = await serviceSupabase
      .from("organizations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    // Log activity
    await serviceSupabase.from("organization_activity_log").insert({
      organization_id: id,
      activity_type: "settings_updated",
      actor_id: user.id,
      metadata: { action: "status_change", new_status: status }
    })

    return successResponse(organization, `Organization status updated to ${status}`)
  } catch (error) {
    return handleApiError(error)
  }
}
