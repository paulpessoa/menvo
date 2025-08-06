"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Event } from "@/types/events"
import { Clock, MapPin } from 'lucide-react'

interface EventCalendarProps {
  events: Record<string, Event[]>
}

export default function EventCalendar({ events }: EventCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const eventsForSelectedDate = selectedDate
    ? events[format(selectedDate, "yyyy-MM-dd")] || []
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendário de Eventos</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col lg:flex-row gap-6">
        <div className="flex-shrink-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            locale={ptBR}
            modifiers={{
              hasEvent: (date) => {
                const dateString = format(date, "yyyy-MM-dd")
                return !!events[dateString] && events[dateString].length > 0
              },
            }}
            modifiersStyles={{
              hasEvent: {
                fontWeight: 'bold',
                backgroundColor: 'hsl(var(--primary) / 0.1)',
                borderRadius: '0.375rem',
              },
            }}
          />
        </div>
        <div className="flex-1 space-y-4">
          <h3 className="text-lg font-semibold">
            Eventos em {selectedDate ? format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR }) : "Nenhuma data selecionada"}
          </h3>
          {eventsForSelectedDate.length === 0 ? (
            <p className="text-muted-foreground">Nenhum evento agendado para esta data.</p>
          ) : (
            <div className="space-y-3">
              {eventsForSelectedDate.map((event) => (
                <div key={event.id} className="border rounded-md p-3">
                  <h4 className="font-medium">{event.title}</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {event.time}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {event.location}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary">{event.type}</Badge>
                    <Badge variant="outline">{event.format}</Badge>
                    {event.is_free && <Badge className="bg-green-500">Gratuito</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
