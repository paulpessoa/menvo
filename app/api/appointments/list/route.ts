import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ [APPOINTMENTS] Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ [APPOINTMENTS] User authenticated:', user.id);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, confirmed, cancelled, completed
    const role = searchParams.get('role'); // mentor, mentee
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('appointments')
      .select(`
        *,
        mentor:mentor_id(id, email, first_name, last_name, full_name, avatar_url),
        mentee:mentee_id(id, email, first_name, last_name, full_name, avatar_url)
      `)
      .order('scheduled_at', { ascending: true })
      .range(offset, offset + limit - 1);

    // Filter by user role
    if (role === 'mentor') {
      query = query.eq('mentor_id', user.id);
    } else if (role === 'mentee') {
      query = query.eq('mentee_id', user.id);
    } else {
      // Show appointments where user is either mentor or mentee
      query = query.or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`);
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    console.log('🔍 [APPOINTMENTS] Query params:', { role, status, limit, offset });

    const { data: appointments, error: appointmentsError } = await query;

    if (appointmentsError) {
      console.error('❌ [APPOINTMENTS] Error fetching appointments:', appointmentsError);
      console.error('   Details:', JSON.stringify(appointmentsError, null, 2));
      return NextResponse.json(
        { error: 'Failed to fetch appointments', details: appointmentsError.message },
        { status: 500 }
      );
    }

    console.log('✅ [APPOINTMENTS] Found:', appointments?.length || 0, 'appointments');

    // Get total count for pagination
    let countQuery = supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });

    if (role === 'mentor') {
      countQuery = countQuery.eq('mentor_id', user.id);
    } else if (role === 'mentee') {
      countQuery = countQuery.eq('mentee_id', user.id);
    } else {
      countQuery = countQuery.or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`);
    }

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting appointments:', countError);
    }

    return NextResponse.json({
      success: true,
      appointments: appointments || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });

  } catch (error) {
    console.error('Error in appointments list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}