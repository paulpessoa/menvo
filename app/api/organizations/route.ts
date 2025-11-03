import { createClient } from "@/utils/supabase/server"
import { createServiceRoleClient } from "@/utils/supabase/service-role"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse,
  validateRequiredFields
} from "@/lib/api/error-handler"
import type {
  Organization,
  CreateOrganizationRequest
} from "@/types/organizations"

// GET /api/organizations - List organizations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    const type = searchParams.get("type")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let query = supabase
      .from("organizations")
      .select("*", { count: "exact" })
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (type) {
      query = query.eq("type", type)
    }

    if (search) {
      query = query.ilike("name", `%${search}%`)
    }

    const { data, error, count } = await query

    if (error) throw error

    return successResponse({
      organizations: data as Organization[],
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

// POST /api/organizations - Create organization
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceSupabase = createServiceRoleClient()

    // Authenticate user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    const body: CreateOrganizationRequest = await request.json()

    // Validate required fields
    const validation = validateRequiredFields(body, [
      "name",
      "type",
      "contact_email"
    ])
    if (!validation.valid) {
      return errorResponse(
        `Missing required fields: ${validation.missing?.join(", ")}`,
        "VALIDATION_ERROR",
        400
      )
    }

    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Create organization
    const { data: organization, error: orgError } = await serviceSupabase
      .from("organizations")
      .insert({
        name: body.name,
        slug,
        type: body.type,
        description: body.description,
        logo_url: body.logo_url,
        website: body.website,
        contact_email: body.contact_email,
        contact_phone: body.contact_phone,
        status: "pending_approval"
      })
      .select()
      .single()

    if (orgError) throw orgError

    // Create organization admin membership for creator
    const { error: memberError } = await serviceSupabase
      .from("organization_members")
      .insert({
        organization_id: organization.id,
        user_id: user.id,
        role: "admin",
        status: "active",
        activated_at: new Date().toISOString()
      })

    if (memberError) throw memberError

    // Log activity
    await serviceSupabase.from("organization_activity_log").insert({
      organization_id: organization.id,
      activity_type: "organization_created",
      actor_id: user.id
    })

    return successResponse(
      organization as Organization,
      "Organization created successfully. Pending admin approval."
    )
  } catch (error) {
    return handleApiError(error)
  }
}
