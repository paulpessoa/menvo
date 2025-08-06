"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Grid3X3, Map, Search, SlidersHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

import type { Event, EventFilters as EventFiltersType } from "@/types/events"
import EventFilters from "@/components/events/event-filters"
import EventMap from "@/components/events/event-map"
import EventCard from "@/components/events/event-card"
import EventCalendar from "@/components/events/event-calendar"
import { mockEvents } from "@/data/mock-events" // Corrected typo from mock-eventss.ts

export default function EventsPage() {
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<EventFiltersType>({
    search: "",
    types: [],
    formats: [],
    sources: [],
    priceRange: [0, 1000],
    dateRange: {},
    tags: [],
    isFree: undefined,
  })

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    return mockEvents.filter((event) => {
      // Search filter
      if (
        filters.search &&
        !event.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !event.description.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false
      }

      // Type filter
      if (filters.types.length > 0 && !filters.types.includes(event.type)) {
        return false
      }

      // Format filter
      if (filters.formats.length > 0 && !filters.formats.includes(event.format)) {
        return false
      }

      // Source filter
      if (filters.sources.length > 0 && !filters.sources.includes(event.source)) {
        return false
      }

      // Price filter
      if (filters.isFree !== undefined) {
        if (filters.isFree && !event.is_free) return false
        if (!filters.isFree && event.is_free) return false
      }

      if (!event.is_free && (event.price < filters.priceRange[0] || event.price > filters.priceRange[1])) {
        return false
      }

      // Date filter
      if (filters.dateRange.start) {
        const eventDate = new Date(event.start_date)
        const filterStart = new Date(filters.dateRange.start)
        if (eventDate < filterStart) return false
      }

      if (filters.dateRange.end) {
        const eventDate = new Date(event.start_date)
        const filterEnd = new Date(filters.dateRange.end)
        if (eventDate > filterEnd) return false
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((tag) => event.tags.includes(tag))
        if (!hasMatchingTag) return false
      }

      return true
    })
  }, [filters])

  // Group events by date for calendar
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Event[]> = {}
    filteredEvents.forEach((event) => {
      const date = event.start_date
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(event)
    })
    return grouped
  }, [filteredEvents])

  const handleFilterChange = (newFilters: Partial<EventFiltersType>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      types: [],
      formats: [],
      sources: [],
      priceRange: [0, 1000],
      dateRange: {},
      tags: [],
      isFree: undefined,
    })
  }

  const activeFiltersCount = [
    filters.types.length,
    filters.formats.length,
    filters.sources.length,
    filters.tags.length,
    filters.isFree !== undefined ? 1 : 0,
    filters.dateRange.start || filters.dateRange.end ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0)

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">Eventos da Comunidade</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <EventFilters filters={filters} onFiltersChange={handleFilterChange} onClearFilters={clearFilters} />
          </div>
          <div className="lg:col-span-2">
            <div className="grid gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Localização dos Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <EventMap events={filteredEvents} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
