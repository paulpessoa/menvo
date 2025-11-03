import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"
import type { Organization } from "@/types/organizations"

// GET /api/admin/organizations/[id] - Get organization details (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

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

    // Get member counts
    const { data: memberCounts } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", id)
      .eq("status", "active")

    const stats = {
      mentors: memberCounts?.filter((m) => m.role === "mentor").length || 0,
      mentees: memberCounts?.filter((m) => m.role === "mentee").length || 0,
      admins: memberCounts?.filter((m) => m.role === "admin").length || 0,
      sessions: 0 // TODO: Count appointments
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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

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
