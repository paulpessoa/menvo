import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest } from "next/server"
import { errorResponse, handleApiError, successResponse } from "@/lib/api/error-handler"
import { requestMentorSchema } from "@/lib/schemas/profile"
import { buildMentorRequestService } from "@/lib/services/profile/mentor-request.composition"

/**
 * POST /api/profile/request-mentor - o usuário pede para ser mentor. Fina:
 * auth, Zod, service, status. A ordem (RPC, textos, aviso ao admin) está em
 * `mentor-request.service.ts`.
 */
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

    const parsed = requestMentorSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Dados inválidos", "VALIDATION_ERROR", 400)
    }

    const outcome = await buildMentorRequestService(supabase).submit(user, parsed.data)
    if (outcome.kind === "failed") return handleApiError(outcome.cause)

    return successResponse(outcome.data, "Solicitação enviada com sucesso")
  } catch (error) {
    return handleApiError(error)
  }
}
