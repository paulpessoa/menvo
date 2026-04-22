import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string, inviteId: string }> }
) {
  try {
    const supabase = await createClient()
    const { orgId, inviteId } = await params

    // Check if user is org admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401)

    const { data: membership } = await supabase
      .from("organization_members")
      .select("role, status")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .returns<any>()
      .single()

    if (!membership || membership.role !== "admin" || membership.status !== "active") {
      return errorResponse("Forbidden", "FORBIDDEN", 403)
    }

    // Get invitation
    const { data: invitation } = await supabase
      .from("organization_invitations")
      .select("*")
      .eq("id", inviteId)
      .eq("organization_id", orgId)
      .returns<any>()
      .single()

    if (!invitation) {
      return errorResponse("Invitation not found", "NOT_FOUND", 404)
    }

    // Cancel invitation
    const { error: cancelError } = await (supabase
      .from("organization_invitations" as any)
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", inviteId) as any)

    if (cancelError) throw cancelError

    return successResponse(null, "Invitation cancelled successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
