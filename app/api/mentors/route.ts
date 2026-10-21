import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { mentorsByIdsQuerySchema } from "@/lib/schemas/mentors"
import { buildMentorProfileService } from "@/lib/services/mentors/mentor-profile.composition"

/**
 * GET /api/mentors?ids=a,b,c - perfis públicos de vários mentores numa consulta.
 * Substitui as leituras de `mentors_view` que o navegador fazia direto
 * (favoritos do dashboard e mentores recomendados pela IA). Dados públicos: não
 * exige login, mas passa pelo client de servidor (RLS, nunca service_role) e
 * só devolve quem o diretório lista (verificado e público).
 */
export async function GET(request: NextRequest) {
  const parsed = mentorsByIdsQuerySchema.safeParse({ ids: request.nextUrl.searchParams.get("ids") ?? "" })
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe de 1 a 50 ids de mentor válidos" }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const mentors = await buildMentorProfileService(supabase).listPublicMentors(parsed.data.ids)
    return NextResponse.json({ mentors })
  } catch (error) {
    console.error("[GET /api/mentors]", (error as Error).message)
    return NextResponse.json({ error: "Não foi possível carregar os mentores" }, { status: 500 })
  }
}
