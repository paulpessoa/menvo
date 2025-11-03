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
