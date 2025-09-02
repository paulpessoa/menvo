import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { AvailableTimeSlot } from '@/types/appointments';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const mentorId = searchParams.get('mentor_id');
    const startDate = searchParams.get('start_date'); // YYYY-MM-DD
    const endDate = searchParams.get('end_date'); // YYYY-MM-DD
    
    if (!mentorId) {
      return NextResponse.json(
        { error: 'mentor_id is required' },
        { status: 400 }
      );
    }

    // Default to next 7 days if no date range provided
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Get mentor availability
    const { data: availability, error: availabilityError } = await supabase
      .from('mentor_availability')
      .select('*')
      .eq('mentor_id', mentorId)
      .order('day_of_week', { ascending: true });

    if (availabilityError) {
      console.error('Error fetching availability:', availabilityError);
      return NextResponse.json(
        { error: 'Failed to fetch availability' },
        { status: 500 }
      );
    }

    if (!availability || availability.length === 0) {
      return NextResponse.json({
        success: true,
        availableSlots: [],
        message: 'No availability configured for this mentor',
      });
    }

    // Get existing appointments in the date range
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('scheduled_at, duration_minutes')
      .eq('mentor_id', mentorId)
      .in('status', ['pending', 'confirmed'])
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString());

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    // Generate available time slots
    const availableSlots: AvailableTimeSlot[] = [];
    const bookedSlots = new Set(
      (appointments || []).map(apt => new Date(apt.scheduled_at).toISOString())
    );

    // Iterate through each day in the range
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Find availability for this day of week
      const dayAvailability = availability.filter(avail => avail.day_of_week === dayOfWeek);
      
      for (const avail of dayAvailability) {
        // Parse start and end times
        const [startHour, startMinute] = avail.start_time.split(':').map(Number);
        const [endHour, endMinute] = avail.end_time.split(':').map(Number);
        
        // Generate 1-hour slots within the availability window
        for (let hour = startHour; hour < endHour; hour++) {
          // Skip if this would go past the end time
          if (hour === endHour - 1 && startMinute > endMinute) {
            continue;
          }
          
          const slotDate = new Date(date);
          slotDate.setHours(hour, startMinute, 0, 0);
          
          // Skip past dates
          if (slotDate <= new Date()) {
            continue;
          }
          
          // Check if slot is not booked
          if (!bookedSlots.has(slotDate.toISOString())) {
            availableSlots.push({
              date: slotDate.toISOString().split('T')[0], // YYYY-MM-DD
              time: `${hour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`, // HH:MM
              datetime: slotDate.toISOString(),
            });
          }
        }
      }
    }

    // Sort slots by datetime
    availableSlots.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

    return NextResponse.json({
      success: true,
      availableSlots,
      totalSlots: availableSlots.length,
    });

  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}