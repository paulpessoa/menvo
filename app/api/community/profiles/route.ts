import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { communityIdsQuerySchema } from "@/lib/schemas/community"
import { buildCommunityService } from "@/lib/services/community/community.composition"

/**
 * GET /api/community/profiles?ids=a,b - perfis do mural por id (o modal de
 * match por IA do /community). Exige login: são dados pessoais e antes saíam
 * direto do navegador com a chave anon. Roda com o client de cookie, então o
 * RLS decide o que cada pessoa vê; os campos são só os do mural.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const parsed = communityIdsQuerySchema.safeParse({ ids: request.nextUrl.searchParams.get("ids") ?? "" })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Parâmetros inválidos" }, { status: 400 })
  }

  try {
    const profiles = await buildCommunityService(supabase).getProfilesByIds(parsed.data.ids)
    return NextResponse.json({ profiles })
  } catch (error) {
    console.error("[GET /api/community/profiles]", error)
    return NextResponse.json({ error: "Erro ao buscar perfis" }, { status: 500 })
  }
}