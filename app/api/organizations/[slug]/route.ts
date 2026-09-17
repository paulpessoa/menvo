import { createClient } from "@/lib/utils/supabase/server"
import { errorResponse, handleApiError, successResponse } from "@/lib/api/error-handler"

// GET /api/organizations/[slug] - public lookup for the /o/[slug] landing + signup pages.
// RLS only exposes rows with status = 'active', so a suspended/unknown slug 404s.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    const { data: organization, error } = await supabase
      .from("organizations" as any)
      .select("slug, name, type")
      .eq("slug", slug)
      .maybeSingle()

    if (error) throw error
    if (!organization) {
      return errorResponse("Organização não encontrada", "NOT_FOUND", 404)
    }

    return successResponse(organization)
  } catch (error) {
    return handleApiError(error)
  }
}
