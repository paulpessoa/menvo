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
    const searchParams = request.nextUrl.searchParams

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

    // Get pagination parameters
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // Get pending invitations with pagination
    const {
      data: invitations,
      error,
      count
    } = await supabase
      .from("organization_members")
      .select(
        `
        *,
        user:profiles(id, email, first_name, last_name, full_name, avatar_url)
      `,
        { count: "exact" }
      )
      .eq("organization_id", orgId)
      .eq("status", "invited")
      .order("invited_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return successResponse({
      invitations,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
