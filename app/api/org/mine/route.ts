import { createClient } from "@/lib/utils/supabase/server"
import { errorResponse, handleApiError, successResponse } from "@/lib/api/error-handler"

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

    const { data: memberships, error } = await supabase
      .from("organization_members" as any)
      .select("organization_id, organizations(id, slug, name)")
      .eq("user_id", user.id)
      .eq("role", "admin")

    if (error) throw error

    const organizations = (memberships ?? [])
      .map((m: any) => m.organizations)
      .filter(Boolean)

    return successResponse(organizations)
  } catch (error) {
    return handleApiError(error)
  }
}
