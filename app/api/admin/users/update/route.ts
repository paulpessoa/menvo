import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PUT(request: Request) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if the user is an admin
  const { data: adminProfile, error: adminProfileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminProfileError || adminProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Not an admin' }, { status: 403 });
  }

  const updates = await request.json();
  const { id, ...rest } = updates; // 'id' is the user ID to update

  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(rest)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data, message: 'User updated successfully' });
  } catch (error: any) {
    console.error('Error updating user:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
