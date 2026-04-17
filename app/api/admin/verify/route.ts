import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { processVerification, VerificationStatus } from '@/lib/services/verification.service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Check Auth & Admin Role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)
      .single()

    const isAdmin = (roleData?.roles as any)?.name === 'admin'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

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
      adminId: user.id,
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
