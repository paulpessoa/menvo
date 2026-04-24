import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

import type { Database } from "@/lib/types/supabase"

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"]

// GET /api/admin/organizations - List all organizations (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Check Auth & Admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401)

    const { data: roleDataResult } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id)
      .single()

    const roleData = roleDataResult as any;

    const userRole = roleData?.roles?.name
    if (userRole !== "admin" && userRole !== "moderator") {
      return errorResponse("Forbidden - Admin only", "FORBIDDEN", 403)
    }

    // 2. Fetch Organizations
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from("organizations")
      .select(`
        *,
        member_count:organization_members(count)
      `, { count: "exact" })

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
    }

    const { data: orgsData, error: orgsError, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to)
      
    if (orgsError) throw orgsError

    // Ajustar o formato da contagem retornada pelo Supabase
    const formattedOrgs = (orgsData as any[])?.map(org => ({
      ...org,
      member_count: org.member_count?.[0]?.count || 0
    }))

    return successResponse({
      organizations: formattedOrgs,
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
