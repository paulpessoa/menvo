import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"
import type { Organization } from "@/lib/types/organizations"

// GET /api/admin/organizations - List all organizations (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

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

    const userRole = roleData?.roles?.name
    if (userRole !== "admin" && userRole !== "moderator") {
      return errorResponse(
        "Forbidden - Admin access required",
        "FORBIDDEN",
        403
      )
    }

    // Get query parameters
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from("organizations")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error, count } = await query

    if (error) throw error

    // Fetch counts for each organization
    const orgsWithStats = await Promise.all((data as Organization[]).map(async (org) => {
      // Direct links (new structure)
      const { count: profileCount } = await supabase
        .from("profiles")
        .select("*", { count: 'exact', head: true })
        .eq("organization_id", org.id)

      // Legacy links
      const { count: legacyCount } = await supabase
        .from("organization_members")
        .select("*", { count: 'exact', head: true })
        .eq("organization_id", org.id)
        .eq("status", "active")

      return {
        ...org,
        memberCount: (profileCount || 0) + (legacyCount || 0)
      }
    }))

    return successResponse({
      organizations: orgsWithStats,
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
