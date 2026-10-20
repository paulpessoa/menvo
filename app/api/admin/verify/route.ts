import { NextRequest, NextResponse } from 'next/server'
import { processVerification } from '@/lib/services/verifications/notification.service'
import { requireAdmin } from '@/lib/auth/require-admin'
import { adminVerifyBodySchema } from '@/lib/schemas/admin-users'

/**
 * Decides a mentor application. Single entry point for every admin screen
 * (verifications queue and the user modal) so they can't diverge.
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const parsed = adminVerifyBodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'userId e status são obrigatórios' }, { status: 400 })
    }

    const result = await processVerification({
      ...parsed.data,
      adminId: guard.admin.userId
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API VERIFICATION] Erro:', error)
    const message = error instanceof Error ? error.message : 'Erro interno do servidor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
