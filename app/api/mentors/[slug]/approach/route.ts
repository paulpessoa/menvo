import { NextRequest } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { errorResponse, handleApiError, successResponse } from "@/lib/api/error-handler"

interface RouteParams {
  params: Promise<{ slug: string }>
}

/**
 * Returns a mentor's "Abordagem de Mentoria" / "O que esperar" texts.
 * Only for authenticated users — these are not part of the public mentor
 * profile payload (mentors/[slug]/page.tsx), so a logged-out visitor or a
 * crawler never receives them.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    if (!slug || slug === "undefined") {
      return errorResponse("Mentor não encontrado", "NOT_FOUND", 404)
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
    const query = supabase
      .from("mentors_view")
      .select("mentorship_approach, what_to_expect")
      .eq("verified", true)
      .eq("is_public", true)

    const { data: mentor, error } = await (isUuid ? query.eq("id", slug) : query.eq("slug", slug)).maybeSingle()

    if (error || !mentor) {
      return errorResponse("Mentor não encontrado", "NOT_FOUND", 404)
    }

    return successResponse({
      mentorship_approach: mentor.mentorship_approach ?? null,
      what_to_expect: mentor.what_to_expect ?? null
    })
  } catch (error) {
    return handleApiError(error)
  }
}
