import { createServiceRoleClient } from "@/utils/supabase/service-role"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

// GET /api/organizations/invitations/validate - Validate invitation token
export async function GET(request: NextRequest) {
  try {
    const serviceSupabase = createServiceRoleClient()
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get("token")

    if (!token) {
      return errorResponse("Token is required", "VALIDATION_ERROR", 400)
    }

    // Find invitation by token
    const { data: invitation, error: inviteError } = await serviceSupabase
      .from("organization_members")
      .select(
        `
        *,
        organization:organizations(id, name, slug, type, description, logo_url, status)
      `
      )
      .eq("invitation_token", token)
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

    return successResponse({
      invitation: {
        id: invitation.id,
        role: invitation.role,
        invited_at: invitation.invited_at,
        expires_at: expirationDate.toISOString()
      },
      organization: invitation.organization
    })
  } catch (error) {
    return handleApiError(error)
  }
}
