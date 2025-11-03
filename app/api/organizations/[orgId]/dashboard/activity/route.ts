import { createClient } from "@/utils/supabase/server"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

// GET /api/organizations/[orgId]/dashboard/activity - Activity feed
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

    // Get pagination parameters
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // Query activity log for last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const {
      data: activities,
      error,
      count
    } = await supabase
      .from("organization_activity_log")
      .select(
        `
        *,
        actor:actor_id(id, full_name, email, avatar_url),
        target:target_id(id, full_name, email, avatar_url)
      `,
        { count: "exact" }
      )
      .eq("organization_id", orgId)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Format activities with human-readable messages
    const formattedActivities = activities?.map((activity) => {
      let message = ""
      const actorName = activity.actor?.full_name || "Usuário"
      const targetName = activity.target?.full_name || "Usuário"

      switch (activity.activity_type) {
        case "member_invited":
          message = `${actorName} convidou ${targetName} para a organização`
          break
        case "member_joined":
          message = `${actorName} entrou na organização`
          break
        case "member_left":
          message = `${actorName} saiu da organização`
          break
        case "member_removed":
          message = `${actorName} removeu ${targetName} da organização`
          break
        case "member_role_changed":
          message = `${actorName} alterou a função de ${targetName}`
          break
        case "invitation_cancelled":
          message = `${actorName} cancelou um convite`
          break
        case "invitation_declined":
          message = `${actorName} recusou o convite`
          break
        case "settings_updated":
          message = `${actorName} atualizou as configurações da organização`
          break
        case "organization_created":
          message = `${actorName} criou a organização`
          break
        case "organization_approved":
          message = `Organização foi aprovada`
          break
        default:
          message = `${actorName} realizou uma ação`
      }

      return {
        id: activity.id,
        type: activity.activity_type,
        message,
        actor: activity.actor,
        target: activity.target,
        metadata: activity.metadata,
        created_at: activity.created_at
      }
    })

    return successResponse({
      activities: formattedActivities,
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
