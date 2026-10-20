import type { z } from "zod"
import type { availabilitySlotSchema } from "@/lib/schemas/appointment-responses"

/** A bookable slot as the modal displays it (local date + preformatted labels). */
export interface TimeSlot {
  day_of_week: number
  start_time: string
  end_time: string
  date: Date
  formatted_date: string
  formatted_time: string
}

/** Slot as `/api/appointments/availability` returns it; every field is read defensively. */
export type RawAvailabilitySlot = Partial<z.infer<typeof availabilitySlotSchema>>

/** Maps the Intl locale used for labels from the next-intl locale code. */
export function toIntlLocale(locale: string): string {
  return locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "pt-BR"
}

/**
 * Turns raw availability rows into display slots.
 *
 * Why tolerant: older rows carry only `time`, and a malformed date must drop
 * the row instead of breaking the whole list. The date is built in local time
 * from `YYYY-MM-DD` so the day never shifts with the viewer's UTC offset.
 */
export function toTimeSlots(raw: RawAvailabilitySlot[], intlLocale: string): TimeSlot[] {
  const slots: TimeSlot[] = []

  raw.forEach((slot) => {
    if (!slot?.date) return
    const [year, month, day] = String(slot.date).split("-").map(Number)
    if (!year || !month || !day) return
    const date = new Date(year, month - 1, day)

    const startTime = String(slot.start_time || slot.time || "00:00")
    const endTime = String(slot.end_time || (slot.time ? `${slot.time}:45` : "00:45"))
    const startShort = startTime.length >= 5 ? startTime.substring(0, 5) : startTime
    const endShort = endTime.length >= 5 ? endTime.substring(0, 5) : endTime

    slots.push({
      day_of_week: slot.day_of_week ?? date.getDay(),
      start_time: startTime,
      end_time: endTime,
      date,
      formatted_date: date.toLocaleDateString(intlLocale, { day: "numeric", month: "short" }),
      formatted_time: `${startShort} - ${endShort}`
    })
  })

  return slots
}
