import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"
import { sendMentorNewReviewNotification } from "@/lib/email/brevo"

/**
 * API para Gestão e Moderação de Feedbacks (Admin)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 1. Verificar se é admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401)

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)
      .single() as any

    if (roleData?.roles?.name !== 'admin') {
      return errorResponse("Forbidden", "FORBIDDEN", 403)
    }

    // 2. Processar a atualização
    const { feedbackId, status, rejectionReason } = await request.json()

    if (!feedbackId || !['approved', 'rejected'].includes(status)) {
      return errorResponse("Invalid data", "VALIDATION_ERROR", 400)
    }

    // 3. Atualizar status do feedback
    const { data: updatedFeedback, error: updateError } = await supabase
      .from("appointment_feedbacks")
      .update({ 
          status,
          rejection_reason: rejectionReason || null,
          updated_at: new Date().toISOString()
      } as any)
      .eq('id', feedbackId)
      .select(`
        *,
        mentee:profiles!reviewer_id(full_name),
        mentor:profiles!reviewed_id(full_name, email)
      `)
      .single() as any

    if (updateError) throw updateError

    // 4. Se foi aprovado, notificar o mentor via e-mail
    if (status === 'approved' && updatedFeedback.mentor?.email) {
        sendMentorNewReviewNotification({
            mentorEmail: updatedFeedback.mentor.email,
            mentorName: updatedFeedback.mentor.full_name || 'Mentor',
            menteeName: updatedFeedback.mentee.full_name || 'Um aluno',
            rating: updatedFeedback.rating,
            comment: updatedFeedback.public_feedback
        }).catch(err => console.error("[API] Erro ao enviar email para mentor:", err))
    }

    return successResponse(updatedFeedback, "Feedback moderado com sucesso")
  } catch (error) {
    return handleApiError(error)
  }
}
