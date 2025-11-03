import { createClient } from "@/utils/supabase/server"
import { createServiceRoleClient } from "@/utils/supabase/service-role"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse,
  validateRequiredFields
} from "@/lib/api/error-handler"
import { checkQuota } from "@/lib/organizations/quota-checker"
import type {
  BulkInvitationRequest,
  BulkInvitationResult
} from "@/types/organizations"
import { randomUUID } from "crypto"

// POST /api/organizations/[orgId]/members/bulk-invite - Bulk invite members
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

    // Check organization is active
    const { data: org } = await supabase
      .from("organizations")
      .select("status")
      .eq("id", orgId)
      .single()

    if (!org || org.status !== "active") {
      return errorResponse(
        "Organization is not active",
        "ORGANIZATION_NOT_ACTIVE",
        400
      )
    }

    const body: BulkInvitationRequest = await request.json()

    if (
      !body.invitations ||
      !Array.isArray(body.invitations) ||
      body.invitations.length === 0
    ) {
      return errorResponse("Invalid invitations array", "VALIDATION_ERROR", 400)
    }

    const result: BulkInvitationResult = {
      success_count: 0,
      failed_count: 0,
      errors: []
    }

    // Process each invitation
    for (const invitation of body.invitations) {
      try {
        // Validate fields
        const validation = validateRequiredFields(invitation, ["email", "role"])
        if (!validation.valid) {
          result.failed_count++
          result.errors.push({
            email: invitation.email,
            error: `Missing required fields: ${validation.missing?.join(", ")}`
          })
          continue
        }

        // Check quota
        const quotaType = invitation.role === "mentor" ? "mentors" : "mentees"
        const hasQuota = await checkQuota(orgId, quotaType)
        if (!hasQuota) {
          result.failed_count++
          result.errors.push({
            email: invitation.email,
            error: `Quota exceeded for ${quotaType}`
          })
          continue
        }

        // Find or create user
        let targetUserId: string

        const { data: existingProfile } = await serviceSupabase
          .from("profiles")
          .select("id")
          .eq("email", invitation.email)
          .single()

        if (existingProfile) {
          targetUserId = existingProfile.id
        } else {
          const { data: newProfile, error: profileError } =
            await serviceSupabase
              .from("profiles")
              .insert({
                email: invitation.email,
                verified: false
              })
              .select("id")
              .single()

          if (profileError) {
            result.failed_count++
            result.errors.push({
              email: invitation.email,
              error: profileError.message
            })
            continue
          }
          targetUserId = newProfile.id
        }

        // Check if already a member
        const { data: existingMember } = await serviceSupabase
          .from("organization_members")
          .select("id, status")
          .eq("organization_id", orgId)
          .eq("user_id", targetUserId)
          .eq("role", invitation.role)
          .single()

        if (existingMember && existingMember.status === "active") {
          result.failed_count++
          result.errors.push({
            email: invitation.email,
            error: "User is already a member"
          })
          continue
        }

        // Create member record
        const invitationToken = randomUUID()

        const { error: memberError } = await serviceSupabase
          .from("organization_members")
          .upsert(
            {
              organization_id: orgId,
              user_id: targetUserId,
              role: invitation.role,
              status: "invited",
              invitation_token: invitationToken,
              invited_by: user.id,
              invited_at: new Date().toISOString(),
              expires_at: invitation.expires_at
            },
            { onConflict: "organization_id,user_id,role" }
          )

        if (memberError) {
          result.failed_count++
          result.errors.push({
            email: invitation.email,
            error: memberError.message
          })
          continue
        }

        // Log activity
        await serviceSupabase.from("organization_activity_log").insert({
          organization_id: orgId,
          activity_type: "member_invited",
          actor_id: user.id,
          target_id: targetUserId,
          metadata: { role: invitation.role, bulk: true }
        })

        result.success_count++
        // TODO: Send invitation email
      } catch (error) {
        result.failed_count++
        result.errors.push({
          email: invitation.email,
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }

    return successResponse(
      result,
      `Processed ${body.invitations.length} invitations`
    )
  } catch (error) {
    return handleApiError(error)
  }
}
