import { createClient } from "@/lib/utils/supabase/server"
import { errorResponse, handleApiError, successResponse } from "@/lib/api/error-handler"
import { buildAccountRoleService } from "@/lib/services/profile/account-role.composition"

/**
 * POST /api/profile/stop-mentor - deixa de ser mentor. Fina: auth, service,
 * status. A ordem (tirar a verificação, esconder o perfil, só então trocar o
 * papel) e a exceção de `service_role` (ADR 0008, E2) moram em `account-role.*`.
 */
export async function POST() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    const outcome = await buildAccountRoleService(supabase).stopMentoring(user.id)
    if (outcome.kind === "failed") return handleApiError(outcome.cause)

    return successResponse({ ...outcome.profile, verified: false }, "Você não é mais um mentor")
  } catch (error) {
    return handleApiError(error)
  }
}
