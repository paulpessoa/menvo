import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { mentorSlugParamSchema } from "@/lib/schemas/mentors"
import { buildMentorProfileService } from "@/lib/services/mentors/mentor-profile.composition"

interface RouteParams {
  params: Promise<{ slug: string }>
}

/**
 * GET /api/mentors/[slug] - perfil público de um mentor (slug ou UUID).
 * Usada pela tela de agendamento, que antes lia `mentors_view` do navegador.
 * Dados públicos: sem login; 404 para quem o diretório não lista.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const parsed = mentorSlugParamSchema.safeParse(await params)
  if (!parsed.success) {
    return NextResponse.json({ error: "Mentor não encontrado" }, { status: 404 })
  }

  try {
    const supabase = await createClient()
    const mentor = await buildMentorProfileService(supabase).getPublicMentor(parsed.data.slug)
    if (!mentor) return NextResponse.json({ error: "Mentor não encontrado" }, { status: 404 })
    return NextResponse.json({ mentor })
  } catch (error) {
    console.error("[GET /api/mentors/[slug]]", (error as Error).message)
    return NextResponse.json({ error: "Não foi possível carregar o mentor" }, { status: 500 })
  }
}
