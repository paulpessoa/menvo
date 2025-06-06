"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

type AvailabilityProps = {
  availability: {
    timezone: string
    slots: {
      day: string
      times: string[]
    }[]
  }
}

export default function MentorAvailability({ availability }: AvailabilityProps) {
  const [currentWeek, setCurrentWeek] = useState(0)

  // Get current date and week dates
  const today = new Date()
  const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const weekDates = weekDays.map((_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - today.getDay() + index + currentWeek * 7)
    return date
  })

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const getAvailableTimesForDay = (dayName: string) => {
    const daySlot = availability.slots.find((slot) => slot.day === dayName)
    return daySlot ? daySlot.times : []
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Select a date & time</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeek(currentWeek - 1)}
            disabled={currentWeek === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(currentWeek + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, index) => {
          const dayName = weekDays[index]
          const availableTimes = getAvailableTimesForDay(dayName)
          const hasAvailability = availableTimes.length > 0

          return (
            <div key={index} className="flex flex-col items-center">
              <div className="text-sm font-medium mb-1">{dayName.slice(0, 3)}</div>
              <Button
                variant={isToday(date) ? "default" : "outline"}
                className={`w-full h-10 ${!hasAvailability ? "opacity-50" : ""}`}
                disabled={!hasAvailability}
              >
                {formatDate(date)}
              </Button>
            </div>
          )
        })}
      </div>

      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="h-4 w-4" />
            <span>Available time slots for Wednesday, May 15</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {["9:00 AM", "10:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"].map((time, i) => (
              <Button key={i} variant="outline" className="justify-center">
                {time}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
