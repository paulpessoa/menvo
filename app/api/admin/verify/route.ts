import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { processVerification } from '@/lib/services/verifications/notification.service'
import { requireAdmin } from '@/lib/auth/require-admin'

const bodySchema = z.object({
  userId: z.string().min(1),
  status: z.enum(['approved', 'rejected', 'pending']),
  notes: z.string().max(2000).optional(),
  message: z.string().trim().min(1).max(4000).optional()
})

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'userId e status são obrigatórios' }, { status: 400 })
    }

    const result = await processVerification({
      ...parsed.data,
      adminId: guard.admin.userId
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
