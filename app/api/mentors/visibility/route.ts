import { createClient } from "@/utils/supabase/server"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

// GET /api/mentors/visibility - Get mentor's visibility settings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    // Check if user is a mentor
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role:roles(name)")
      .eq("user_id", user.id)

    const isMentor = roles?.some((r: any) => r.role?.name === "mentor")

    if (!isMentor) {
      return errorResponse(
        "Only mentors can access visibility settings",
        "FORBIDDEN",
        403
      )
    }

    // Query mentor_visibility_settings
    const { data: settings, error } = await supabase
      .from("mentor_visibility_settings")
      .select(
        `
        *,
        organizations:visible_to_organizations(id, name, slug, logo_url)
      `
      )
      .eq("mentor_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error
      throw error
    }

    // If no settings exist, return default
    if (!settings) {
      return successResponse({
        mentor_id: user.id,
        visibility_scope: "public",
        visible_to_organizations: [],
        organizations: []
      })
    }

    return successResponse(settings)
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/mentors/visibility - Update visibility settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    // Check if user is a mentor
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role:roles(name)")
      .eq("user_id", user.id)

    const isMentor = roles?.some((r: any) => r.role?.name === "mentor")

    if (!isMentor) {
      return errorResponse(
        "Only mentors can update visibility settings",
        "FORBIDDEN",
        403
      )
    }

    const body = await request.json()
    const { visibility_scope, visible_to_organizations } = body

    // Validate visibility_scope
    if (
      visibility_scope &&
      !["public", "exclusive"].includes(visibility_scope)
    ) {
      return errorResponse(
        "Invalid visibility_scope. Must be 'public' or 'exclusive'",
        "VALIDATION_ERROR",
        400
      )
    }

    // If exclusive, validate user is member of selected organizations
    if (
      visibility_scope === "exclusive" &&
      visible_to_organizations &&
      visible_to_organizations.length > 0
    ) {
      const { data: memberships } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .in("organization_id", visible_to_organizations)

      const memberOrgIds = memberships?.map((m) => m.organization_id) || []

      // Check if all requested organizations are valid
      const invalidOrgs = visible_to_organizations.filter(
        (orgId: string) => !memberOrgIds.includes(orgId)
      )

      if (invalidOrgs.length > 0) {
        return errorResponse(
          "You must be an active member of all selected organizations",
          "VALIDATION_ERROR",
          400
        )
      }
    }

    // Update or create settings
    const { data: existing } = await supabase
      .from("mentor_visibility_settings")
      .select("*")
      .eq("mentor_id", user.id)
      .single()

    let result

    if (existing) {
      // Update existing settings
      const { data, error } = await supabase
        .from("mentor_visibility_settings")
        .update({
          visibility_scope: visibility_scope || existing.visibility_scope,
          visible_to_organizations:
            visible_to_organizations !== undefined
              ? visible_to_organizations
              : existing.visible_to_organizations,
          updated_at: new Date().toISOString()
        })
        .eq("mentor_id", user.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from("mentor_visibility_settings")
        .insert({
          mentor_id: user.id,
          visibility_scope: visibility_scope || "public",
          visible_to_organizations: visible_to_organizations || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return successResponse(result, "Visibility settings updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
