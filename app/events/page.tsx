'use client'

import { useState, useMemo } from 'react'
import { EventCard } from '@/components/events/event-card'
import { EventFilters } from '@/components/events/event-filters'
import { EventMap } from '@/components/events/event-map'
import { mockEvents } from '@/data/mock-eventss'
import { Event } from '@/types/events'
import { Input } from '@/components/ui/input'
import { SearchIcon } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function EventsPage() {
  const [filters, setFilters] = useState({
    category: 'all',
    location: '',
    dateRange: 'all',
  })
  const [searchTerm, setSearchTerm] = useState('')

  const filteredEvents = useMemo(() => {
    let filtered = mockEvents.filter(event => event.title.toLowerCase().includes(searchTerm.toLowerCase()))

    if (filters.category !== 'all') {
      filtered = filtered.filter(event => event.category === filters.category)
    }

    if (filters.location) {
      filtered = filtered.filter(event => event.location.toLowerCase().includes(filters.location.toLowerCase()))
    }

    const now = new Date()
    if (filters.dateRange === 'upcoming') {
      filtered = filtered.filter(event => new Date(event.date) >= now)
    } else if (filters.dateRange === 'past') {
      filtered = filtered.filter(event => new Date(event.date) < now)
    }

    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [filters, searchTerm])

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">Eventos da Comunidade</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Filters and Search */}
          <div className="lg:col-span-1 space-y-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar eventos por título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <EventFilters filters={filters} onFilterChange={setFilters} />
          </div>

          {/* Events List */}
          <div className="lg:col-span-2">
            {filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">Nenhum evento encontrado com os filtros aplicados.</p>
              </div>
            )}
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-6 text-center">Eventos no Mapa</h2>
          <EventMap events={filteredEvents} />
        </div>
      </div>
    </ProtectedRoute>
  )
}
