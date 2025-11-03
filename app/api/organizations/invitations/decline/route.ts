import { createClient } from "@/utils/supabase/server"
import { createServiceRoleClient } from "@/utils/supabase/service-role"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

// POST /api/organizations/invitations/decline - Decline invitation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceSupabase = createServiceRoleClient()

    // Authenticate user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    const body = await request.json()
    const { invitation_token } = body

    if (!invitation_token) {
      return errorResponse(
        "Invitation token is required",
        "VALIDATION_ERROR",
        400
      )
    }

    // Find invitation by token
    const { data: invitation, error: inviteError } = await serviceSupabase
      .from("organization_members")
      .select("*")
      .eq("invitation_token", invitation_token)
      .single()

    if (inviteError || !invitation) {
      return errorResponse("Invalid invitation token", "INVALID_TOKEN", 400)
    }

    // Verify user matches invitation
    if (invitation.user_id !== user.id) {
      return errorResponse(
        "Invitation is for a different user",
        "FORBIDDEN",
        403
      )
    }

    // Update status to declined and invalidate token
    const { error: updateError } = await serviceSupabase
      .from("organization_members")
      .update({
        status: "declined",
        invitation_token: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", invitation.id)

    if (updateError) throw updateError

    // Log activity to organization_activity_log
    await serviceSupabase.from("organization_activity_log").insert({
      organization_id: invitation.organization_id,
      activity_type: "invitation_declined",
      actor_id: user.id,
      target_id: user.id,
      metadata: {
        invitation_id: invitation.id,
        role: invitation.role
      }
    })

    return successResponse({ success: true }, "Invitation declined")
  } catch (error) {
    return handleApiError(error)
  }
}
