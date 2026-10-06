import { NextRequest } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { errorResponse, successResponse } from "@/lib/api/error-handler"
import { mentorSlugParamSchema } from "@/lib/schemas/mentors"
import { buildMentorProfileService } from "@/lib/services/mentors/mentor-profile.composition"

interface RouteParams {
  params: Promise<{ slug: string }>
}

/**
 * GET /api/mentors/[slug]/approach - os textos "Abordagem de Mentoria" e
 * "O que esperar" de um mentor. Só para quem está logado: não fazem parte do
 * perfil público (mentors/[slug]/page.tsx), então visitante anônimo e
 * crawler nunca os recebem. A regra vive no service (`getApproach`).
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const parsed = mentorSlugParamSchema.safeParse(await params)
  if (!parsed.success) {
    return errorResponse("Mentor não encontrado", "NOT_FOUND", 404)
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const result = await buildMentorProfileService(supabase).getApproach(parsed.data.slug, !!user)

  switch (result.kind) {
    case "unauthorized":
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    case "not_found":
      return errorResponse("Mentor não encontrado", "NOT_FOUND", 404)
    case "ok":
      return successResponse(result.approach)
  }
}
