import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import {
  hasAcceptedCurrentTerms,
  recordTermsAcceptance,
} from "@/lib/services/legal/terms-acceptance.service"

/**
 * GET/POST /api/legal/accept-terms - whether the caller accepted the current
 * Terms of Use, and a way to record that they do
 * (docs/archive/COMMUNITY_CONTACT_PLAN.md §12.1).
 *
 * The user id always comes from the session, never from the request, and the
 * insert runs with the caller's own client so the RLS policy and the column
 * grants on `terms_acceptances` stay in force.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  try {
    const accepted = await hasAcceptedCurrentTerms(supabase, user.id)
    return NextResponse.json({ accepted })
  } catch (error) {
    console.error("[GET /api/legal/accept-terms] Erro:", error)
    return NextResponse.json({ error: "Não foi possível verificar o aceite" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  try {
    await recordTermsAcceptance(supabase, user.id, request.headers.get("user-agent"))
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[POST /api/legal/accept-terms] Erro:", error)
    return NextResponse.json({ error: "Não foi possível registrar o aceite" }, { status: 500 })
  }
}
