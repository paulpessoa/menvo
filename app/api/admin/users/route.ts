import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/service'; // Import the service client

export async function GET(req: NextRequest) {
  const supabase = createClient(); // Use the service client for admin operations

  // Ensure only authenticated admins can access this route
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // In a real application, you'd check the user's role here
  // For now, we'll assume any authenticated user can fetch users,
  // but for sensitive admin actions, you'd verify `user.app_metadata.user_role === 'admin'`
  // or query the user_profiles table for their role.

  try {
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('*'); // Select all user profiles

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    console.error('Unexpected error fetching users:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
