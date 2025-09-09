import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hasGoogleCalendarConnected } from '@/lib/google-calendar-db';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const isConnected = await hasGoogleCalendarConnected(user.id);

    return NextResponse.json({
      connected: isConnected,
      userId: user.id
    });
  } catch (error) {
    console.error('Error checking calendar status:', error);
    return NextResponse.json(
      { error: 'Failed to check calendar status' },
      { status: 500 }
    );
  }
}
