import { createClient } from "@/lib/utils/supabase/server"
import { errorResponse, handleApiError, successResponse } from "@/lib/api/error-handler"
import { createOrganizationsRepository } from "@/lib/repositories/organizations.repository"

// GET /api/org/mine - organizations the logged-in user administers, so
// /dashboard/org can find which org to load without the id in the URL.
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse("Não autenticado", "UNAUTHORIZED", 401)
    }

    const organizations = await createOrganizationsRepository(supabase).listAdminOrganizations(user.id)

    return successResponse(organizations)
  } catch (error) {
    return handleApiError(error)
  }
}
