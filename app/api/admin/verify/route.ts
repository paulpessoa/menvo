import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { VerificationProfileNotFoundError } from '@/lib/services/verifications/notification.service'
import { buildMentorVerificationService } from '@/lib/services/verifications/verification.composition'
import { adminForbiddenResponse } from '@/lib/services/admin/assert-admin'
import { requireAdmin } from '@/lib/auth/require-admin'
import { adminVerifyBodySchema } from '@/lib/schemas/admin-users'

/**
 * Decides a mentor application. Single entry point for every admin screen
 * (verifications queue and the user modal) so they can't diverge. The service
 * re-checks admin (`assertAdmin`) and records the decision in the audit log.
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const parsed = adminVerifyBodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'userId e status são obrigatórios' }, { status: 400 })
    }

    const supabase = await createClient()
    const result = await buildMentorVerificationService(supabase).processVerification({
      ...parsed.data,
      adminId: guard.admin.userId,
      request
    })

    return NextResponse.json(result)
  } catch (error) {
    const forbidden = adminForbiddenResponse(error)
    if (forbidden) return forbidden
    if (error instanceof VerificationProfileNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error('[API VERIFICATION] Erro:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
