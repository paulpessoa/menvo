import { createClient } from "@/utils/supabase/server"
import { createServiceRoleClient } from "@/utils/supabase/service-role"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

// PATCH /api/organizations/[orgId]/members/[memberId] - Update member
export async function PATCH(
  request: NextRequest,
  { params }: { params: { orgId: string; memberId: string } }
) {
  try {
    const supabase = await createClient()
    const serviceSupabase = createServiceRoleClient()
    const { orgId, memberId } = params

    // Authenticate user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    // Get member to update
    const { data: targetMember } = await supabase
      .from("organization_members")
      .select("*")
      .eq("id", memberId)
      .eq("organization_id", orgId)
      .single()

    if (!targetMember) {
      return errorResponse("Member not found", "NOT_FOUND", 404)
    }

    // Check permissions: user must be org admin OR the member themselves
    const { data: userMembership } = await supabase
      .from("organization_members")
      .select("role, status")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .single()

    const isAdmin =
      userMembership?.role === "admin" && userMembership?.status === "active"
    const isSelf = targetMember.user_id === user.id

    if (!isAdmin && !isSelf) {
      return errorResponse("Forbidden", "FORBIDDEN", 403)
    }

    const body = await request.json()

    // Users can only update their own status (accept/decline/leave)
    // Admins can update status, expires_at, and role
    const updates: any = {}

    if (isSelf && !isAdmin) {
      // Self updates: only status changes
      if (body.status && ["active", "declined", "left"].includes(body.status)) {
        updates.status = body.status
        if (body.status === "active") {
          updates.activated_at = new Date().toISOString()
        } else if (body.status === "left") {
          updates.left_at = new Date().toISOString()
        }
      }
    } else if (isAdmin) {
      // Admin updates: more fields
      if (body.status) updates.status = body.status
      if (body.expires_at !== undefined) updates.expires_at = body.expires_at
      if (body.role) updates.role = body.role
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse("No valid fields to update", "VALIDATION_ERROR", 400)
    }

    updates.updated_at = new Date().toISOString()

    // Update member
    const { data: updatedMember, error: updateError } = await serviceSupabase
      .from("organization_members")
      .update(updates)
      .eq("id", memberId)
      .select()
      .single()

    if (updateError) throw updateError

    // Log activity if status changed
    if (updates.status) {
      const activityType =
        updates.status === "active"
          ? "member_joined"
          : updates.status === "left"
          ? "member_left"
          : null

      if (activityType) {
        await serviceSupabase.from("organization_activity_log").insert({
          organization_id: orgId,
          activity_type: activityType,
          actor_id: user.id,
          target_id: targetMember.user_id
        })
      }
    }

    return successResponse(updatedMember, "Member updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/organizations/[orgId]/members/[memberId] - Remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { orgId: string; memberId: string } }
) {
  try {
    const supabase = await createClient()
    const serviceSupabase = createServiceRoleClient()
    const { orgId, memberId } = params

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

    // Get member to delete
    const { data: targetMember } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("id", memberId)
      .eq("organization_id", orgId)
      .single()

    if (!targetMember) {
      return errorResponse("Member not found", "NOT_FOUND", 404)
    }

    // Update status to 'left' instead of deleting
    const { error: updateError } = await serviceSupabase
      .from("organization_members")
      .update({
        status: "left",
        left_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", memberId)

    if (updateError) throw updateError

    // Cancel future appointments
    await serviceSupabase
      .from("appointments")
      .update({
        status: "cancelled",
        cancellation_reason: "Member removed from organization",
        cancelled_by: user.id,
        cancelled_at: new Date().toISOString()
      })
      .eq("organization_id", orgId)
      .or(
        `mentor_id.eq.${targetMember.user_id},mentee_id.eq.${targetMember.user_id}`
      )
      .eq("status", "pending")
      .gt("scheduled_at", new Date().toISOString())

    // Log activity
    await serviceSupabase.from("organization_activity_log").insert({
      organization_id: orgId,
      activity_type: "member_left",
      actor_id: user.id,
      target_id: targetMember.user_id
    })

    return successResponse({ success: true }, "Member removed successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
