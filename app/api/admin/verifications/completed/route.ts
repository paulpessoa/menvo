import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { listMentorVerifications } from "@/lib/services/verifications/verification-list.service"

/**
 * GET /api/admin/verifications/completed - mentor applications already
 * decided (approved or rejected), newest first.
 * Reads `mentor_profiles` (see listMentorVerifications).
 */
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  try {
    const supabase = await createClient()
    const verifications = await listMentorVerifications(supabase, ["approved", "rejected"])
    return NextResponse.json({ verifications })
  } catch (error) {
    console.error("[GET /api/admin/verifications/completed] Erro:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Não foi possível carregar as verificações" }, { status: 500 })
  }
}
