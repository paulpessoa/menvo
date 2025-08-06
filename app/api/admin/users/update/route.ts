import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { UserRole, UserStatus } from '@/types/database'

export async function POST(request: Request) {
  const supabase = createServiceRoleClient()
  const { id, role, status } = await request.json()

  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  const updateData: { role?: UserRole; status?: UserStatus } = {}
  if (role) updateData.role = role
  if (status) updateData.status = status

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No update data provided' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data[0])
}
