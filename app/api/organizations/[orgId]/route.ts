import { createClient } from "@/utils/supabase/server"
import { createServiceRoleClient } from "@/utils/supabase/service-role"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"
import type {
  Organization,
  UpdateOrganizationRequest
} from "@/types/organizations"

// GET /api/organizations/[orgId] - Get organization details
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient()
    const { orgId } = params

    const { data: organization, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single()

    if (error) throw error
    if (!organization) {
      return errorResponse("Organization not found", "NOT_FOUND", 404)
    }

    // Get member count
    const { count: memberCount } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "active")

    return successResponse({
      ...organization,
      member_count: memberCount || 0
    } as Organization & { member_count: number })
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/organizations/[orgId] - Update organization
export async function PATCH(
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

    const body: UpdateOrganizationRequest = await request.json()

    // Update organization
    const { data: organization, error: updateError } = await serviceSupabase
      .from("organizations")
      .update({
        name: body.name,
        description: body.description,
        logo_url: body.logo_url,
        website: body.website,
        contact_email: body.contact_email,
        contact_phone: body.contact_phone,
        updated_at: new Date().toISOString()
      })
      .eq("id", orgId)
      .select()
      .single()

    if (updateError) throw updateError

    // Log activity
    await serviceSupabase.from("organization_activity_log").insert({
      organization_id: orgId,
      activity_type: "settings_updated",
      actor_id: user.id
    })

    return successResponse(
      organization as Organization,
      "Organization updated successfully"
    )
  } catch (error) {
    return handleApiError(error)
  }
}
