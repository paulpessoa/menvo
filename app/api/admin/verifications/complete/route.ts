import { NextRequest, NextResponse } from 'next/server'
import { VerificationService } from '@/services/verifications'
import { getUserFromRequest } from '@/utils/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || !user.role || !['admin', 'moderator'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { verificationId, passed, notes } = body

    if (!verificationId || typeof passed !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    await VerificationService.completeVerification({
      verificationId,
      adminId: user.id,
      passed,
      notes
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}