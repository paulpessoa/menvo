import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { buildMentorVerificationListService } from "@/lib/services/verifications/verification.composition"

/**
 * GET /api/admin/mentors - lista de mentores para o painel administrativo.
 * Movido de `adminService.getAllMentors`, que consultava `mentors_view`
 * direto do navegador (docs/COMMUNITY_CONTACT_PLAN.md §13).
 *
 * `mentors_view` não carrega mais `email` (ela é legível por visitantes
 * anônimos, migração 20260929160000); o service busca o e-mail em `profiles`,
 * que a RLS permite a um admin ler.
 *
 * Não há POST: candidaturas a mentor são decididas só por POST
 * /api/admin/verify (papel, publicação do perfil e aviso à pessoa).
 */
export async function GET() {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const db = await createClient()
    const mentors = await buildMentorVerificationListService(db).listMentors()

    return NextResponse.json({ mentors })
  } catch (error) {
    const forbidden = adminForbiddenResponse(error)
    if (forbidden) return forbidden
    console.error("[GET /api/admin/mentors] Erro:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Não foi possível carregar os mentores" }, { status: 500 })
  }
}
