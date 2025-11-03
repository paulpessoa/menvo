import { createClient } from "@/utils/supabase/server"
import { createServiceRoleClient } from "@/utils/supabase/service-role"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"
import { randomUUID } from "crypto"

// POST /api/organizations/[orgId]/invitations/[inviteId]/resend - Resend invitation
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

    if (invitation.status !== "invited") {
      return errorResponse("Invitation is not pending", "VALIDATION_ERROR", 400)
    }

    // Generate new token and extend expiration
    const newToken = randomUUID()
    const newExpiresAt = new Date()
    newExpiresAt.setDate(newExpiresAt.getDate() + 30)

    const { data: updated, error: updateError } = await serviceSupabase
      .from("organization_members")
      .update({
        invitation_token: newToken,
        invited_at: new Date().toISOString(),
        expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", inviteId)
      .select()
      .single()

    if (updateError) throw updateError

    // TODO: Send invitation email

    return successResponse(updated, "Invitation resent successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
