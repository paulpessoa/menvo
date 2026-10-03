import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { hasGoogleCalendarConnected } from '@/lib/google-calendar-db';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ connected: false }, { status: 401 });
    }

    const connected = await hasGoogleCalendarConnected(user.id);
    return NextResponse.json({ connected });
  } catch (error) {
    console.error('Error checking calendar status:', error);
    return NextResponse.json({ connected: false }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { disconnectGoogleCalendar } = await import('@/lib/google-calendar-db');
    await disconnectGoogleCalendar(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
