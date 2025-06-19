"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns"
import type { Event } from "@/types/events"

interface EventCalendarProps {
  eventsByDate: Record<string, Event[]>
  onDateSelect: (date: string) => void
}

export default function EventCalendar({ eventsByDate, onDateSelect }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return eventsByDate[dateStr] || []
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Events Calendar
          </CardTitle>
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-medium">{format(currentDate, "MMMM yyyy")}</h3>
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const events = getEventsForDate(day)
            const hasEvents = events.length > 0
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isTodayDate = isToday(day)

            return (
              <Button
                key={day.toISOString()}
                variant="ghost"
                size="sm"
                className={`
                  h-10 p-1 relative flex flex-col items-center justify-center
                  ${!isCurrentMonth ? "text-muted-foreground opacity-50" : ""}
                  ${isTodayDate ? "bg-primary text-primary-foreground" : ""}
                  ${hasEvents ? "font-medium" : ""}
                `}
                onClick={() => onDateSelect(format(day, "yyyy-MM-dd"))}
              >
                <span className="text-xs">{format(day, "d")}</span>
                {hasEvents && (
                  <Badge variant="secondary" className="absolute -bottom-1 h-4 w-4 p-0 text-xs rounded-full">
                    {events.length}
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="h-4 w-4 p-0 text-xs rounded-full">
              N
            </Badge>
            <span>Number of events</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
