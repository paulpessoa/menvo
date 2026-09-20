import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getCalendarBusyIntervals } from "@/lib/services/mentorship/google-calendar.service"
import { computeAvailableSlots } from "@/lib/services/appointments/availability.service"

export async function GET(request: NextRequest) {
  try {
    // Usar Service Role para permitir leitura pública da disponibilidade
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    const { searchParams } = new URL(request.url)

    const mentorId = searchParams.get("mentor_id")
    const startDate = searchParams.get("start_date") // YYYY-MM-DD
    const endDate = searchParams.get("end_date") // YYYY-MM-DD

    if (!mentorId) {
      return NextResponse.json(
        { error: "mentor_id is required" },
        { status: 400 }
      )
    }

    // Default to next 7 days if no date range provided
    const start = startDate ? new Date(startDate) : new Date()
    const end = endDate
      ? new Date(endDate)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    // Generate available time slots using the new shared service
    const availableSlots = await computeAvailableSlots(supabase, mentorId, start, end)

    return NextResponse.json({
      success: true,
      availableSlots,
      totalSlots: availableSlots.length
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
