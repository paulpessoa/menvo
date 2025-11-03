import { createClient } from "@/utils/supabase/server"
import { createServiceRoleClient } from "@/utils/supabase/service-role"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

// POST /api/organizations/invitations/accept - Accept invitation
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
      .select(
        `
        *,
        organization:organizations(id, name, slug, type, logo_url, status)
      `
      )
      .eq("invitation_token", invitation_token)
      .single()

    if (inviteError || !invitation) {
      return errorResponse("Invalid invitation token", "INVALID_TOKEN", 400)
    }

    // Check if invitation is still pending
    if (invitation.status !== "invited") {
      return errorResponse(
        "Invitation is no longer valid",
        "INVALID_TOKEN",
        400
      )
    }

    // Check if token is expired (30 days)
    const invitedDate = new Date(invitation.invited_at)
    const expirationDate = new Date(invitedDate)
    expirationDate.setDate(expirationDate.getDate() + 30)

    if (new Date() > expirationDate) {
      return errorResponse("Invitation has expired", "TOKEN_EXPIRED", 400)
    }

    // Verify user matches invitation
    if (invitation.user_id !== user.id) {
      return errorResponse(
        "Invitation is for a different user",
        "FORBIDDEN",
        403
      )
    }

    // Update membership to active
    const { data: updatedMember, error: updateError } = await serviceSupabase
      .from("organization_members")
      .update({
        status: "active",
        activated_at: new Date().toISOString(),
        invitation_token: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", invitation.id)
      .select()
      .single()

    if (updateError) throw updateError

    // Log activity
    await serviceSupabase.from("organization_activity_log").insert({
      organization_id: invitation.organization_id,
      activity_type: "member_joined",
      actor_id: user.id,
      target_id: user.id,
      metadata: { role: invitation.role }
    })

    // TODO: Send notification to org admins

    return successResponse(
      {
        member: updatedMember,
        organization: invitation.organization
      },
      "Invitation accepted successfully"
    )
  } catch (error) {
    return handleApiError(error)
  }
}
