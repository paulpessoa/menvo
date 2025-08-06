import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if the user is an admin
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Not an admin' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const roleFilter = searchParams.get('role');
  const isProfileCompleteFilter = searchParams.get('is_profile_complete');
  const verifiedFilter = searchParams.get('verified');

  let query = supabase
    .from('user_profiles')
    .select(`
      id,
      full_name,
      email,
      role,
      is_profile_complete,
      verified_at,
      current_position,
      years_experience
    `);

  if (roleFilter) {
    query = query.eq('role', roleFilter);
  }
  if (isProfileCompleteFilter) {
    query = query.eq('is_profile_complete', isProfileCompleteFilter === 'true');
  }
  if (verifiedFilter) {
    if (verifiedFilter === 'true') {
      query = query.not('verified_at', 'is', null);
    } else {
      query = query.is('verified_at', null);
    }
  }

  const { data: users, error } = await query;

  if (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: users });
}
