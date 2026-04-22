import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const supabase = await createClient()
    const { orgId } = await params

    // 1. Verificar permissão do usuário na organização
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    if (authError || !user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401)

    const { data: member } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", user.id)
      .eq("organization_id", orgId)
      .maybeSingle()

    if (!member) {
      return errorResponse("Forbidden - Not a member", "FORBIDDEN", 403)
    }

    // 2. Coletar estatísticas
    const [
      { count: mentorCount },
      { count: menteeCount },
      { count: sessionCount },
      { count: pendingInvites }
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: 'exact', head: true }).eq("organization_id", orgId).eq("user_type", "mentor"),
      supabase.from("profiles").select("*", { count: 'exact', head: true }).eq("organization_id", orgId).eq("user_type", "mentee"),
      supabase.from("appointments").select("*", { count: 'exact', head: true }).eq("organization_id", orgId),
      supabase.from("organization_invitations").select("*", { count: 'exact', head: true }).eq("organization_id", orgId).eq("status", "pending")
    ])

    return successResponse({
      mentors: mentorCount || 0,
      mentees: menteeCount || 0,
      sessions: sessionCount || 0,
      pendingInvites: pendingInvites || 0
    })
  } catch (error) {
    return handleApiError(error)
  }
}
