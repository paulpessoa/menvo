import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"
import { sendAdminNewMentorNotification } from "@/lib/email/brevo"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    const body = await request.json().catch(() => ({}))
    const mentorshipApproach =
      typeof body?.mentorship_approach === "string" ? body.mentorship_approach.trim() : ""
    const whatToExpect =
      typeof body?.what_to_expect === "string" ? body.what_to_expect.trim() : ""

    if (!mentorshipApproach) {
      return errorResponse(
        "Conte como você pretende conduzir suas mentorias antes de enviar a solicitação",
        "VALIDATION_ERROR",
        400
      )
    }

    // O status só muda pela RPC (o usuário não tem grant na coluna); quem já
    // está aprovado continua aprovado.
    const { error: requestError } = await supabase.rpc("request_mentor_verification")
    if (requestError) throw requestError

    const { data: mentor, error } = await supabase
      .from("mentor_profiles")
      .update({ mentorship_approach: mentorshipApproach, what_to_expect: whatToExpect || null })
      .eq("user_id", user.id)
      .select("user_id, verification_status")
      .single()

    if (error) throw error

    const data = {
      id: mentor.user_id,
      is_pending_mentor: mentor.verification_status === "pending",
      verification_status: mentor.verification_status,
    }

    // Notificar admin
    const userName = `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email || 'Usuário'

    sendAdminNewMentorNotification({
        userName: userName,
        userEmail: user.email || '',
        mentorshipApproach,
        whatToExpect: whatToExpect || undefined
    }).catch(err => console.error('[API] Error sending admin notification:', err))

    return successResponse(data, "Solicitação enviada com sucesso")
  } catch (error) {
    return handleApiError(error)
  }
}
