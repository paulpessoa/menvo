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

    // Marcar perfil como solicitante de mentor
    const { data, error } = await supabase
      .from("profiles" as any)
      .update({ 
        is_pending_mentor: true,
        verification_status: 'pending'
      })
      .eq("id", user.id)
      .select()
      .single()

    if (error) throw error

    // Notificar admin
    const userName = `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email || 'Usuário'
    
    sendAdminNewMentorNotification({
        userName: userName,
        userEmail: user.email || ''
    }).catch(err => console.error('[API] Error sending admin notification:', err))

    return successResponse(data, "Solicitação enviada com sucesso")
  } catch (error) {
    return handleApiError(error)
  }
}
