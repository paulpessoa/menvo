import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

    // Get mentor availability
    const { data: availability, error: availabilityError } = await supabase
      .from("mentor_availability")
      .select("*")
      .eq("mentor_id", mentorId)
      .order("day_of_week", { ascending: true })

    if (availabilityError) {
      return NextResponse.json(
        { error: "Failed to fetch availability" },
        { status: 500 }
      )
    }

    if (!availability || availability.length === 0) {
      return NextResponse.json({
        success: true,
        availableSlots: [],
        message: "No availability configured for this mentor"
      })
    }

    // Get existing appointments in the date range
    const { data: appointments } = await supabase
      .from("appointments")
      .select("scheduled_at, duration_minutes")
      .eq("mentor_id", mentorId)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString())

    // Generate available time slots
    const availableSlots: any[] = []

    const isSlotBooked = (
      slotStart: Date,
      slotDuration: number = 45
    ): boolean => {
      return (appointments || []).some((apt: any) => {
        const aptStart = new Date(apt.scheduled_at)
        const aptEnd = new Date(
          aptStart.getTime() + apt.duration_minutes * 60 * 1000
        )
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000)
        return slotStart < aptEnd && slotEnd > aptStart
      })
    }

    let current = new Date(start.getTime())
    current.setHours(0, 0, 0, 0)

    const safeEnd = new Date(end.getTime())
    safeEnd.setHours(23, 59, 59, 999)

    while (current <= safeEnd) {
      const dayOfWeek = current.getDay()
      const dayAvailability = availability.filter(
        (avail) => Number(avail.day_of_week) === dayOfWeek
      )

      if (dayAvailability.length > 0) {
        const dateStr = current.toISOString().split("T")[0]

        for (const avail of dayAvailability as any[]) {
          const [startHour, startMinute] = avail.start_time
            .split(":")
            .map(Number)
          const [endHour, endMinute] = avail.end_time.split(":").map(Number)

          for (let hour = startHour; hour < endHour; hour++) {
            const h = hour.toString().padStart(2, "0")
            const m = startMinute.toString().padStart(2, "0")
            
            // Gerar ISO com offset explícito de Brasília (-03:00) para garantir 
            // que a conversão para UTC (Z) seja sempre correta (+3h)
            const slotIso = `${dateStr}T${h}:${m}:00-03:00`
            const utcDate = new Date(slotIso)

            if (utcDate > new Date()) {
              if (!isSlotBooked(utcDate, 45)) {
                availableSlots.push({
                  date: dateStr,
                  time: `${h}:${m}`,
                  datetime: utcDate.toISOString()
                })
              }
            }
          }
        }
      }
      current.setDate(current.getDate() + 1)
    }

    availableSlots.sort(
      (a: any, b: any) =>
        new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    )

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
