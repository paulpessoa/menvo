import { createClient } from "@/utils/supabase/server"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

// GET /api/organizations/[orgId]/invitations - List pending invitations
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient()
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

    // Get pending invitations
    const { data: invitations, error } = await supabase
      .from("organization_members")
      .select(
        `
        *,
        user:profiles(id, email, first_name, last_name, full_name, avatar_url)
      `
      )
      .eq("organization_id", orgId)
      .eq("status", "invited")
      .order("invited_at", { ascending: false })

    if (error) throw error

    return successResponse({ invitations })
  } catch (error) {
    return handleApiError(error)
  }
}
