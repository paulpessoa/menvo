import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service';

export async function POST(request: Request) {
  const supabase = createServiceRoleClient();
  const { id, updates } = await request.json();

  if (!id || !updates) {
    return NextResponse.json({ error: 'User ID and updates are required.' }, { status: 400 });
  }

  // In a real application, you would add authorization checks here
  // to ensure only admin users can access this endpoint.
  // For example, check user role from session or a custom claim.

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'User not found or no changes made.' }, { status: 404 });
  }

  return NextResponse.json(data[0]);
}
