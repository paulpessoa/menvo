"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Calendar } from "lucide-react"

interface AvailabilitySlot {
  day_of_week: number
  start_time: string
  end_time: string
  timezone?: string | null
}

interface AvailabilityDisplayProps {
  availability: AvailabilitySlot[] | null
  availability_status?: string | null
}

export function AvailabilityDisplay({
  availability,
  availability_status
}: AvailabilityDisplayProps) {
  const t = useTranslations("availability")

  if (!availability || availability.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            {t("noAvailability")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            {t("noAvailabilityDesc")}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Agrupar por dia da semana
  const grouped = availability.reduce(
    (acc: Record<number, AvailabilitySlot[]>, slot: AvailabilitySlot) => {
      const day = slot.day_of_week
      if (!acc[day]) acc[day] = []
      acc[day].push(slot)
      return acc
    },
    {}
  )

  const daysOrder = [0, 1, 2, 3, 4, 5, 6]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t("slotsTitle")}
          </CardTitle>
          {availability_status && (
            <Badge
              variant={
                availability_status === "available" ? "default" : "secondary"
              }
              className="text-[10px] uppercase"
            >
              {availability_status}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {daysOrder.map((day) => {
          const slots = grouped[day]
          if (!slots || slots.length === 0) return null

          return (
            <div key={day} className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t(`days.${day}`)}
              </h4>
              <div className="flex flex-wrap gap-2">
                {slots
                  .sort((a: AvailabilitySlot, b: AvailabilitySlot) =>
                    a.start_time.localeCompare(b.start_time)
                  )
                  .map((slot, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="font-medium bg-muted/30"
                    >
                      {slot.start_time.substring(0, 5)} -{" "}
                      {slot.end_time.substring(0, 5)}
                    </Badge>
                  ))}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
