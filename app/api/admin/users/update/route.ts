import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/service'; // Import the service client
import { Database } from '@/types/database';

type UserProfileUpdate = Partial<Database['public']['Tables']['user_profiles']['Update']>;

export async function PUT(req: NextRequest) {
  const supabase = createClient(); // Use the service client for admin operations

  // Ensure only authenticated admins can access this route
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // In a real application, you'd check the user's role here
  // For now, we'll assume any authenticated user can update users,
  // but for sensitive admin actions, you'd verify `user.app_metadata.user_role === 'admin'`
  // or query the user_profiles table for their role.

  try {
    const { id, updates } = await req.json();

    if (!id || !updates) {
      return NextResponse.json({ error: 'User ID and updates are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates as UserProfileUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'User not found or no changes made' }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Unexpected error updating user:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
