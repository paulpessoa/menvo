'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EventCalendar } from '@/components/events/event-calendar'
import { EventCard } from '@/components/events/event-card'
import { mockEvents } from '@/data/mock-eventss' // Corrected import name
import { Event } from '@/types/events'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const eventsForSelectedDate = selectedDate
    ? mockEvents.filter(event =>
        new Date(event.date).toDateString() === selectedDate.toDateString()
      )
    : []

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">Calendário de Eventos e Sessões</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Selecione uma Data</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Events List for Selected Date */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                Eventos e Sessões em {selectedDate?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {eventsForSelectedDate.length > 0 ? (
                eventsForSelectedDate.map(event => (
                  <EventCard key={event.id} event={event} />
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum evento ou sessão agendada para esta data.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-6 text-center">Todos os Eventos</h2>
          <EventCalendar events={mockEvents} />
        </div>
      </div>
    </ProtectedRoute>
  )
}
