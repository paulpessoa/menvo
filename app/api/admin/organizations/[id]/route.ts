import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"
import type { Organization } from "@/lib/types/organizations"

// GET /api/admin/organizations/[id] - Get organization details (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Authenticate user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id)
      .returns<any>()
      .single()

    const userRole = (roleData?.roles as any)?.name
    if (userRole !== "admin" && userRole !== "moderator") {
      return errorResponse(
        "Forbidden - Admin access required",
        "FORBIDDEN",
        403
      )
    }

    // Get organization
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .single()

    if (orgError) {
      if (orgError.code === "PGRST116") {
        return errorResponse("Organization not found", "NOT_FOUND", 404)
      }
      throw orgError
    }

    // Get counts
    const { count: mentorCount } = await supabase
      .from("profiles")
      .select("*", { count: 'exact', head: true })
      .eq("organization_id", id)
      .eq("user_type", "mentor")

    const { count: menteeCount } = await supabase
      .from("profiles")
      .select("*", { count: 'exact', head: true })
      .eq("organization_id", id)
      .eq("user_type", "mentee")

    const { count: sessionCount } = await supabase
      .from("appointments")
      .select("*", { count: 'exact', head: true })
      .eq("organization_id", id)

    const stats = {
      mentors: mentorCount || 0,
      mentees: menteeCount || 0,
      sessions: sessionCount || 0
    }

    return successResponse({
      organization: organization as Organization,
      stats
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/admin/organizations/[id] - Update organization (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Authenticate user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id)
      .returns<any>()
      .single()

    const userRole = (roleData?.roles as any)?.name
    if (userRole !== "admin" && userRole !== "moderator") {
      return errorResponse(
        "Forbidden - Admin access required",
        "FORBIDDEN",
        403
      )
    }

    const body = await request.json()

    // Update organization
    const { data: organization, error: updateError } = await supabase
      .from("organizations")
      .update(body)
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    return successResponse(
      organization as Organization,
      "Organization updated successfully"
    )
  } catch (error) {
    return handleApiError(error)
  }
}
