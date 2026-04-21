import { NextRequest, NextResponse } from "next/server"
import { AvailableTimeSlot } from "@/lib/types/appointments"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    // Usar Service Role para permitir leitura pública da disponibilidade
    // A disponibilidade dos mentores deve ser visível para todos
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
      console.error(
        "[AVAILABILITY] Error fetching availability:",
        availabilityError
      )
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
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("scheduled_at, duration_minutes")
      .eq("mentor_id", mentorId)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString())

    if (appointmentsError) {
      console.error("[AVAILABILITY] Error fetching appointments:", appointmentsError)
      return NextResponse.json(
        { error: "Failed to fetch appointments" },
        { status: 500 }
      )
    }

    // Generate available time slots
    const availableSlots: AvailableTimeSlot[] = []

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

    // Loop de geração de slots à prova de fusos
    // Começamos do 'start' e vamos até 'end'
    let current = new Date(start.getTime());
    // Normalizar current para o início do dia local para o loop ser consistente
    current.setHours(0, 0, 0, 0);

    const safeEnd = new Date(end.getTime());
    safeEnd.setHours(23, 59, 59, 999);

    while (current <= safeEnd) {
      // Pegar o dia da semana (0-6)
      const dayOfWeek = current.getDay();
      
      const dayAvailability = availability.filter(
        (avail) => Number(avail.day_of_week) === dayOfWeek
      );

      if (dayAvailability.length > 0) {
        const dateStr = current.toISOString().split('T')[0];
        
        for (const avail of dayAvailability as any[]) {
          const [startHour, startMinute] = avail.start_time.split(":").map(Number);
          const [endHour, endMinute] = avail.end_time.split(":").map(Number);

          for (let hour = startHour; hour < endHour; hour++) {
            // Ignorar se for o último slot e passar do minuto final
            if (hour === endHour - 1 && startMinute > endMinute) continue;

            // Criar data do slot no fuso de Brasília (-03:00)
            const h = hour.toString().padStart(2, '0');
            const m = startMinute.toString().padStart(2, '0');
            const slotIso = `${dateStr}T${h}:${m}:00-03:00`;
            const slotDate = new Date(slotIso);

            // Só adicionar se for no futuro
            if (slotDate > new Date()) {
              if (!isSlotBooked(slotDate, 45)) {
                availableSlots.push({
                  date: dateStr,
                  time: `${h}:${m}`,
                  datetime: slotDate.toISOString()
                });
              }
            }
          }
        }
      }
      
      // Incrementar 1 dia
      current.setDate(current.getDate() + 1);
    }

    // Sort slots by datetime
    availableSlots.sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    )

    return NextResponse.json({
      success: true,
      availableSlots,
      totalSlots: availableSlots.length
    })
  } catch (error) {
    console.error("[AVAILABILITY] Fatal error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
