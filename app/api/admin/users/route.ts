import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service';

export async function GET(request: Request) {
  const supabase = createServiceRoleClient();

  // In a real application, you would add authorization checks here
  // to ensure only admin users can access this endpoint.
  // For example, check user role from session or a custom claim.

  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('*');

  if (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(users);
}
