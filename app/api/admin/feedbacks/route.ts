import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest } from "next/server"
import { errorResponse, successResponse } from "@/lib/api/error-handler"
import { requireAdmin } from "@/lib/auth/require-admin"
import { feedbackModerationBodySchema } from "@/lib/schemas/admin"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { FeedbackNotFoundError } from "@/lib/services/admin/feedbacks.service"
import { buildAdminFeedbacksService } from "@/lib/services/admin/ops.composition"

/** Traduz o erro do service para a resposta; erro de banco não vaza mensagem. */
function failure(error: unknown, context: string) {
  const forbidden = adminForbiddenResponse(error)
  if (forbidden) return forbidden
  if (error instanceof FeedbackNotFoundError) {
    return errorResponse(error.message, "NOT_FOUND", error.status)
  }
  console.error(`[${context}] Error:`, error)
  return errorResponse("Erro interno do servidor", "INTERNAL_ERROR", 500)
}

/** GET /api/admin/feedbacks - avaliações pendentes de moderação. */
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  try {
    const service = buildAdminFeedbacksService(await createClient())
    return successResponse(await service.listPending())
  } catch (error) {
    return failure(error, "GET /api/admin/feedbacks")
  }
}

/** PATCH /api/admin/feedbacks - aprova ou rejeita uma avaliação (audita e avisa o mentor). */
export async function PATCH(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = feedbackModerationBodySchema.safeParse(await request.json().catch(() => null))
  if (!body.success) return errorResponse("Invalid data", "VALIDATION_ERROR", 400)

  try {
    const service = buildAdminFeedbacksService(await createClient())
    const updated = await service.moderate(guard.admin.userId, body.data)
    return successResponse(updated, "Feedback moderado com sucesso")
  } catch (error) {
    return failure(error, "PATCH /api/admin/feedbacks")
  }
}
