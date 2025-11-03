import { createClient } from "@/utils/supabase/server"
import { createServiceRoleClient } from "@/utils/supabase/service-role"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

// POST /api/organizations/[orgId]/invitations/[inviteId]/cancel - Cancel invitation
export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string; inviteId: string } }
) {
  try {
    const supabase = await createClient()
    const serviceSupabase = createServiceRoleClient()
    const { orgId, inviteId } = params

    // Authenticate user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    // Check if user is org admin
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role, status")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .single()

    if (
      !membership ||
      membership.role !== "admin" ||
      membership.status !== "active"
    ) {
      return errorResponse("Forbidden", "FORBIDDEN", 403)
    }

    // Get invitation
    const { data: invitation } = await supabase
      .from("organization_members")
      .select("*")
      .eq("id", inviteId)
      .eq("organization_id", orgId)
      .single()

    if (!invitation) {
      return errorResponse("Invitation not found", "NOT_FOUND", 404)
    }

    // Update status to cancelled and invalidate token
    const { error: updateError } = await serviceSupabase
      .from("organization_members")
      .update({
        status: "cancelled",
        invitation_token: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", inviteId)

    if (updateError) throw updateError

    // Log activity to organization_activity_log
    await serviceSupabase.from("organization_activity_log").insert({
      organization_id: orgId,
      activity_type: "invitation_cancelled",
      actor_id: user.id,
      metadata: {
        invitation_id: inviteId,
        invited_user_id: invitation.user_id,
        role: invitation.role
      }
    })

    return successResponse(
      { success: true },
      "Invitation cancelled successfully"
    )
  } catch (error) {
    return handleApiError(error)
  }
}
