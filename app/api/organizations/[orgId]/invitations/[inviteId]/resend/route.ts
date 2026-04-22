import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; inviteId: string }> }
) {
  try {
    const supabase = await createClient()
    const { orgId, inviteId } = await params

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    // Buscar convite
    const { data: invitation, error: inviteError } = await supabase
      .from("organization_invitations")
      .select("*")
      .eq("id", inviteId)
      .eq("organization_id", orgId)
      .single()

    if (inviteError || !invitation) {
      return errorResponse("Invitation not found", "NOT_FOUND", 404)
    }

    if (invitation.status !== "pending") {
      return errorResponse("Invitation is no longer pending", "BAD_REQUEST", 400)
    }

    // Atualizar data de expiração e reenviar
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data: updatedInvite, error: updateError } = await supabase
      .from("organization_invitations")
      .update({
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", inviteId)
      .select()
      .single()

    if (updateError) throw updateError

    // Aqui dispararia o e-mail novamente (lógica de e-mail omitida ou via trigger)

    return successResponse(updatedInvite, "Invitation resent successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
