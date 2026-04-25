import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest } from "next/server"
import type { Database } from "@/lib/types/supabase"

type VisUpdate = Database['public']['Tables']['mentor_visibility_settings']['Update'];
type VisInsert = Database['public']['Tables']['mentor_visibility_settings']['Insert'];
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
      .returns<any[]>()

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
      .from("mentor_visibility_settings" as any)
      .select("*")
      .eq("mentor_id", user.id)
      .returns<any>()
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    // If no settings exist, return default (always public now)
    if (!settings) {
      return successResponse({
        mentor_id: user.id,
        visibility_scope: "public",
        visible_to_organizations: []
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
      .returns<any[]>()

    const isMentor = roles?.some((r: any) => r.role?.name === "mentor")

    if (!isMentor) {
      return errorResponse(
        "Only mentors can update visibility settings",
        "FORBIDDEN",
        403
      )
    }

    const body = await request.json()
    const { visibility_scope } = body

    // Validate visibility_scope - only public is allowed now
    if (visibility_scope && visibility_scope !== "public") {
      return errorResponse(
        "Invalid visibility_scope. Only 'public' is supported",
        "VALIDATION_ERROR",
        400
      )
    }

    // Update or create settings
    const { data: existing } = await supabase
      .from("mentor_visibility_settings" as any)
      .select("*")
      .eq("mentor_id", user.id)
      .maybeSingle()

    let result

    if (existing) {
      const updateData: VisUpdate = {
        visibility_scope: "public",
        visible_to_organizations: [],
        updated_at: new Date().toISOString()
      };
      const { data, error } = await (supabase
        .from("mentor_visibility_settings") as any)
        .update(updateData)
        .eq("mentor_id", user.id)
        .select()
        .single();

      if (error) throw error
      result = data
    } else {
      const insertData: VisInsert = {
        mentor_id: user.id,
        visibility_scope: "public",
        visible_to_organizations: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { data, error } = await (supabase
        .from("mentor_visibility_settings") as any)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error
      result = data
    }

    return successResponse(result, "Visibility settings updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
