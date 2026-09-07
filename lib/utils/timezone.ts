/**
 * Timezone and availability time calculation utilities
 */

export interface TimezoneOption {
  value: string
  label: string
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  { value: "America/Sao_Paulo", label: "Horário de Brasília (GMT-3)" },
  { value: "America/Manaus", label: "Horário de Manaus (GMT-4)" },
  { value: "America/Belem", label: "Horário de Belém (GMT-3)" },
  { value: "America/Fortaleza", label: "Horário de Fortaleza (GMT-3)" },
  { value: "America/Recife", label: "Horário de Recife (GMT-3)" },
  { value: "America/Cuiaba", label: "Horário de Cuiabá (GMT-4)" },
  { value: "America/Campo_Grande", label: "Horário de Campo Grande (GMT-4)" },
  { value: "America/Porto_Velho", label: "Horário de Porto Velho (GMT-4)" },
  { value: "America/Boa_Vista", label: "Horário de Boa Vista (GMT-4)" },
  { value: "America/Rio_Branco", label: "Horário do Acre (GMT-5)" },
  { value: "America/Noronha", label: "Fernando de Noronha (GMT-2)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada, GMT-5/4)" },
  { value: "America/Chicago", label: "Central Time (US & Canada, GMT-6/5)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada, GMT-7/6)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada, GMT-8/7)" },
  { value: "Europe/Lisbon", label: "Horário de Lisboa (Portugal, GMT+0/1)" },
  { value: "Europe/Madrid", label: "Horário de Madrid (Espanha, GMT+1/2)" },
  { value: "Europe/London", label: "London (GMT+0/1)" },
  { value: "UTC", label: "Tempo Universal Coordenado (UTC)" }
]

/**
 * Detects the user's browser timezone with a smart Brazilian fallback (America/Sao_Paulo)
 */
export function getBrowserTimezone(): string {
  try {
    if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz && tz !== "UTC") {
        return tz
      }
    }
  } catch {
    // Fallback to default
  }
  return "America/Sao_Paulo"
}

/**
 * Returns a human-friendly label for a timezone
 */
export function formatTimezoneLabel(timezone?: string | null): string {
  if (!timezone || timezone === "UTC") {
    const detected = getBrowserTimezone()
    const found = COMMON_TIMEZONES.find((t) => t.value === detected)
    return found ? found.label : `${detected}`
  }

  const found = COMMON_TIMEZONES.find((t) => t.value === timezone)
  if (found) return found.label

  return timezone
}

/**
 * Adds minutes to a time string (HH:MM or HH:MM:SS) and returns HH:MM:SS
 */
export function addMinutesToTime(timeStr: string, minutesToAdd: number = 45): string {
  if (!timeStr) return "09:45:00"
  const parts = timeStr.split(":")
  const hours = parseInt(parts[0] || "9", 10)
  const minutes = parseInt(parts[1] || "0", 10)

  const totalMinutes = hours * 60 + minutes + minutesToAdd
  const newHours = Math.floor(totalMinutes / 60) % 24
  const newMinutes = totalMinutes % 60

  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}:00`
}

/**
 * Formats time from HH:MM:SS or HH:MM to HH:MM for display
 */
export function formatTimeDisplay(timeStr: string): string {
  if (!timeStr) return ""
  return timeStr.slice(0, 5)
}

/**
 * Generates options for 15-minute time steps from startHour to endHour
 */
export function generateTimeOptions(startHour: number = 6, endHour: number = 23): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  for (let h = startHour; h <= endHour; h++) {
    const hourStr = String(h).padStart(2, "0")
    for (const m of [0, 15, 30, 45]) {
      const minStr = String(m).padStart(2, "0")
      options.push({
        value: `${hourStr}:${minStr}:00`,
        label: `${hourStr}:${minStr}`
      })
    }
  }
  return options
}
