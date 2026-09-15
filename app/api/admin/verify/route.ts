import { NextRequest, NextResponse } from 'next/server'
import { processVerification, VerificationStatus } from '@/lib/services/verifications/notification.service'
import { requireAdmin } from '@/lib/auth/require-admin'

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    // 2. Parse Body
    const body = await request.json()
    const { userId, status, notes } = body as {
      userId: string,
      status: VerificationStatus,
      notes?: string
    }

    if (!userId || !status) {
      return NextResponse.json({ error: 'userId e status são obrigatórios' }, { status: 400 })
    }

    // 3. Process Verification
    const result = await processVerification({
      userId,
      adminId: guard.admin.userId,
      status,
      notes
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[API VERIFICATION] Erro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
