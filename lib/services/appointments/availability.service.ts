import type { AppointmentsRepository } from "@/lib/repositories/appointments.repository"
import type { MentorAvailabilityRepository } from "@/lib/repositories/mentor-availability.repository"
import { getFeatureFlags } from "@/lib/feature-flags-server"

export interface AvailabilitySlotResult {
  date: string
  time: string
  start_time: string
  end_time: string
  day_of_week: number
  datetime: string
}

/**
 * Leituras que a disponibilidade precisa. Entram por parâmetro para o service não
 * saber qual client (sessão ou `service_role`) está por trás: quem escolhe é
 * `appointments.composition.ts`.
 */
export interface AvailabilityDeps {
  availability: Pick<MentorAvailabilityRepository, "listByMentor">
  appointments: Pick<AppointmentsRepository, "listBusyIntervals">
}

/**
 * Gera os horários livres do mentor no intervalo: agenda semanal menos pedidos
 * pending/confirmed e menos o ocupado do Google Calendar (se a flag estiver ligada).
 * Por que o Google falha em silêncio: a agenda externa é bônus, a lista da Menvo
 * não pode sumir por causa de token vencido ou timeout de 3s.
 */
export async function computeAvailableSlots(
  deps: AvailabilityDeps,
  mentorId: string,
  startDate: Date,
  endDate: Date
): Promise<AvailabilitySlotResult[]> {
  const availability = await deps.availability.listByMentor(mentorId)
  if (availability.length === 0) {
    return []
  }

  // Pedidos que já ocupam horário no intervalo
  const appointments = await deps.appointments.listBusyIntervals(mentorId, startDate, endDate)

  // Generate available time slots
  const availableSlots: AvailabilitySlotResult[] = []
  let googleBusySlots: { start: string; end: string }[] = []

  // Check feature flag and fetch Google Calendar free/busy if enabled
  try {
    const flags = await getFeatureFlags()
    if (flags.google_calendar_sync_flag) {
      const { createUserGoogleCalendarClient } = await import('@/lib/google-calendar-db')
      const { calendar } = await createUserGoogleCalendarClient(mentorId)
      
      const freebusyRes = await calendar.freebusy.query(
        {
          requestBody: {
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            items: [{ id: 'primary' }]
          }
        },
        {
          timeout: 3000,
          signal: AbortSignal.timeout(3000)
        }
      )
      
      const calendars = freebusyRes.data.calendars
      if (calendars && calendars.primary && calendars.primary.busy) {
        googleBusySlots = calendars.primary.busy as { start: string; end: string }[]
      }
    }
  } catch (err) {
    // Silently ignore if user hasn't connected calendar or token expired
    console.log(`[AVAILABILITY] Google Calendar sync skipped for mentor ${mentorId}:`, err instanceof Error ? err.message : err)
  }

  const isSlotBooked = (slotStart: Date, slotDuration: number = 45): boolean => {
    const slotEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000)

    // Check Menvo internal appointments
    const hasMenvoConflict = appointments.some((apt) => {
      const aptStart = new Date(apt.scheduled_at)
      const aptEnd = new Date(aptStart.getTime() + apt.duration_minutes * 60 * 1000)
      return slotStart < aptEnd && slotEnd > aptStart
    })

    if (hasMenvoConflict) return true

    // Check Google Calendar busy periods
    const hasGoogleConflict = googleBusySlots.some((busy) => {
      const busyStart = new Date(busy.start)
      const busyEnd = new Date(busy.end)
      return slotStart < busyEnd && slotEnd > busyStart
    })

    return hasGoogleConflict
  }

  let current = new Date(startDate.getTime())
  current.setHours(0, 0, 0, 0)

  const safeEnd = new Date(endDate.getTime())
  safeEnd.setHours(23, 59, 59, 999)

  while (current <= safeEnd) {
    const dayOfWeek = current.getDay()
    const dayAvailability = availability.filter((avail) => Number(avail.day_of_week) === dayOfWeek)

    if (dayAvailability.length > 0) {
      const dateStr = current.toISOString().split("T")[0]

      for (const avail of dayAvailability) {
        const [startHour, startMinute] = avail.start_time.split(":").map(Number)
        const [endHour, endMinute] = avail.end_time.split(":").map(Number)

        const startTotalMinutes = startHour * 60 + startMinute
        const endTotalMinutes = endHour * 60 + endMinute
        const slotDuration = 45

        let currentSlotStart = startTotalMinutes
        while (currentSlotStart + slotDuration <= endTotalMinutes) {
          const h = Math.floor(currentSlotStart / 60)
            .toString()
            .padStart(2, "0")
          const m = (currentSlotStart % 60).toString().padStart(2, "0")

          const slotEndMinutes = currentSlotStart + slotDuration
          const endH = Math.floor(slotEndMinutes / 60)
            .toString()
            .padStart(2, "0")
          const endM = (slotEndMinutes % 60).toString().padStart(2, "0")

          // Gerar ISO com offset explícito de Brasília (-03:00) para garantir
          // que a conversão para UTC (Z) seja sempre correta (+3h)
          const slotIso = `${dateStr}T${h}:${m}:00-03:00`
          const utcDate = new Date(slotIso)

          const startTimeStr = `${h}:${m}:00`
          const endTimeStr = `${endH}:${endM}:00`

          if (utcDate > new Date()) {
            if (!isSlotBooked(utcDate, slotDuration)) {
              availableSlots.push({
                date: dateStr,
                time: `${h}:${m}`,
                start_time: startTimeStr,
                end_time: endTimeStr,
                day_of_week: dayOfWeek,
                datetime: utcDate.toISOString(),
              })
            }
          }

          // Próximo slot: se o intervalo couber mais slots com passo de 60 min (15 min de intervalo),
          // usa 60 min; caso contrário, avança a duração da mentoria (45 min)
          const step = currentSlotStart + 60 + slotDuration <= endTotalMinutes ? 60 : slotDuration
          currentSlotStart += step
        }
      }
    }
    current.setDate(current.getDate() + 1)
  }

  availableSlots.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())

  return availableSlots
}
