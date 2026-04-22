import { createClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { NextRequest, NextResponse } from "next/server"
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
    const { data: invitationData, error: inviteError } = await serviceSupabase
      .from("organization_members" as any)
      .select(`
        *,
        organization:organizations(id, name, slug, logo_url, status)
      `)
      .eq("invitation_token", invitation_token)
      .returns<any>()
      .single()

    if (inviteError || !invitationData) {
      return errorResponse("Invalid invitation token", "INVALID_TOKEN", 400)
    }

    const invitation = invitationData

    // Check if invitation is still pending
    if (invitation.status !== "invited") {
      return errorResponse(
        "Invitation is no longer valid",
        "INVALID_TOKEN",
        400
      )
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
    const { data: updatedMember, error: updateError } = await (serviceSupabase
      .from("organization_members" as any)
      .update({
        status: "active",
        activated_at: new Date().toISOString(),
        invitation_token: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", invitation.id)
      .select()
      .single() as any)

    if (updateError) throw updateError

    // Check if user profile is incomplete
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .returns<any>()
      .single()

    const needsOnboarding =
      !profile ||
      !profile.first_name ||
      !profile.last_name ||
      (invitation.role === "mentor" && !profile.bio)

    // Log activity
    await (serviceSupabase.from("organization_activity_log" as any).insert({
      organization_id: invitation.organization_id,
      activity_type: "member_joined",
      actor_id: user.id,
      target_id: user.id,
      metadata: { role: invitation.role }
    }) as any)

    return successResponse(
      {
        member: updatedMember,
        organization: invitation.organization,
        needsOnboarding
      },
      "Invitation accepted successfully"
    )
  } catch (error) {
    return handleApiError(error)
  }
}
