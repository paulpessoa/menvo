import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { buildMentorVerificationListService } from "@/lib/services/verifications/verification.composition"

/**
 * GET /api/admin/verifications/pending - mentor applications awaiting
 * review.
 * Reads `mentor_profiles` (see createMentorVerificationListService); the
 * service re-checks admin with `assertAdmin` before any privileged read.
 */
export async function GET() {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const supabase = await createClient()
    const verifications = await buildMentorVerificationListService(supabase).listVerifications([
      "pending",
      "changes_requested",
    ])
    return NextResponse.json({ verifications })
  } catch (error) {
    const forbidden = adminForbiddenResponse(error)
    if (forbidden) return forbidden
    console.error("[GET /api/admin/verifications/pending] Erro:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Não foi possível carregar as verificações" }, { status: 500 })
  }
}
