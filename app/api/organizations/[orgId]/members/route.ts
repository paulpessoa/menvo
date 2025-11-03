import { createClient } from "@/utils/supabase/server"
import { createServiceRoleClient } from "@/utils/supabase/service-role"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse,
  validateRequiredFields
} from "@/lib/api/error-handler"
import { validateQuota } from "@/lib/organizations/quota-checker"
import { checkRateLimit, RATE_LIMITS, formatResetTime } from "@/lib/rate-limit"
import type { InvitationRequest } from "@/types/organizations"
import { randomUUID } from "crypto"

// GET /api/organizations/[orgId]/members - List members
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

    // Get filters
    const role = searchParams.get("role")
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let query = supabase
      .from("organization_members")
      .select(
        `
        *,
        user:profiles(id, email, first_name, last_name, full_name, avatar_url)
      `,
        { count: "exact" }
      )
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (role) {
      query = query.eq("role", role)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error, count } = await query

    if (error) throw error

    return successResponse({
      members: data,
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

// POST /api/organizations/[orgId]/members - Invite member
export async function POST(
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

    // Check rate limits
    const minuteLimit = checkRateLimit(
      `org:${orgId}:invitations:minute`,
      RATE_LIMITS.INVITATION_PER_MINUTE
    )

    if (!minuteLimit.allowed) {
      return errorResponse(
        `Limite de convites excedido. Tente novamente em ${formatResetTime(
          minuteLimit.resetAt
        )}`,
        "RATE_LIMIT_EXCEEDED",
        429
      )
    }

    const dayLimit = checkRateLimit(
      `org:${orgId}:invitations:day`,
      RATE_LIMITS.INVITATION_PER_DAY
    )

    if (!dayLimit.allowed) {
      return errorResponse(
        `Limite diário de convites excedido. Tente novamente em ${formatResetTime(
          dayLimit.resetAt
        )}`,
        "RATE_LIMIT_EXCEEDED",
        429
      )
    }

    // Check organization is active
    const { data: org } = await supabase
      .from("organizations")
      .select("status")
      .eq("id", orgId)
      .single()

    if (!org || org.status !== "active") {
      return errorResponse(
        "Organization is not active",
        "ORGANIZATION_NOT_ACTIVE",
        400
      )
    }

    const body: InvitationRequest = await request.json()

    // Validate required fields
    const validation = validateRequiredFields(body, ["email", "role"])
    if (!validation.valid) {
      return errorResponse(
        `Missing required fields: ${validation.missing?.join(", ")}`,
        "VALIDATION_ERROR",
        400
      )
    }

    // Check quota
    const quotaType = body.role === "mentor" ? "mentors" : "mentees"
    await validateQuota(orgId, quotaType)

    // Find or create user by email
    let targetUserId: string

    const { data: existingProfile } = await serviceSupabase
      .from("profiles")
      .select("id")
      .eq("email", body.email)
      .single()

    if (existingProfile) {
      targetUserId = existingProfile.id
    } else {
      // Create pending user profile
      const { data: newProfile, error: profileError } = await serviceSupabase
        .from("profiles")
        .insert({
          email: body.email,
          verified: false
        })
        .select("id")
        .single()

      if (profileError) throw profileError
      targetUserId = newProfile.id
    }

    // Check if already a member
    const { data: existingMember } = await serviceSupabase
      .from("organization_members")
      .select("id, status")
      .eq("organization_id", orgId)
      .eq("user_id", targetUserId)
      .eq("role", body.role)
      .single()

    if (existingMember && existingMember.status === "active") {
      return errorResponse("User is already a member", "ALREADY_MEMBER", 400)
    }

    // Generate invitation token
    const invitationToken = randomUUID()

    // Create or update member record
    const memberData = {
      organization_id: orgId,
      user_id: targetUserId,
      role: body.role,
      status: "invited",
      invitation_token: invitationToken,
      invited_by: user.id,
      invited_at: new Date().toISOString(),
      expires_at: body.expires_at
    }

    const { data: member, error: memberError } = await serviceSupabase
      .from("organization_members")
      .upsert(memberData, { onConflict: "organization_id,user_id,role" })
      .select()
      .single()

    if (memberError) throw memberError

    // Log activity
    await serviceSupabase.from("organization_activity_log").insert({
      organization_id: orgId,
      activity_type: "member_invited",
      actor_id: user.id,
      target_id: targetUserId,
      metadata: { role: body.role }
    })

    // TODO: Send invitation email

    return successResponse(member, "Invitation sent successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
