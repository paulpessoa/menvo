import { NextRequest, NextResponse } from 'next/server'
import { VerificationService } from '@/services/verifications'
import { getUserFromRequest } from '@/utils/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || !['admin', 'moderator'].includes(user.role || 'mentee')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const verifications = await VerificationService.getPendingVerifications(user.id)
    return NextResponse.json(verifications)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}