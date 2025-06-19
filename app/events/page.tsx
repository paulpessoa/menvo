"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Grid3X3, Map, Search, SlidersHorizontal } from "lucide-react"

import type { Event, EventFilters as EventFiltersType } from "@/types/events"
import EventFilters from "@/components/events/event-filters"
import EventMap from "@/components/events/event-map"
import EventCard from "@/components/events/event-card"
import EventCalendar from "@/components/events/event-calendar"
import { mockEvents } from "@/data/mock-eventss"

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
    <div className="container py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Events & Learning</h1>
            <p className="text-muted-foreground">Discover courses, workshops, and events to accelerate your growth</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search events, courses, workshops..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "map")}>
              <TabsList>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  <span className="hidden sm:inline">List</span>
                </TabsTrigger>
                <TabsTrigger value="map" className="flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  <span className="hidden sm:inline">Map</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredEvents.length} events
            {activeFiltersCount > 0 && (
              <Button variant="link" size="sm" onClick={clearFilters} className="ml-2 h-auto p-0">
                Clear filters
              </Button>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar - Filters and Calendar */}
        <div className={`space-y-6 ${showFilters ? "block" : "hidden lg:block"}`}>
          <EventFilters filters={filters} onFiltersChange={handleFilterChange} onClearFilters={clearFilters} />
          <EventCalendar
            eventsByDate={eventsByDate}
            onDateSelect={(date) => {
              handleFilterChange({
                dateRange: { start: date, end: date },
              })
            }}
          />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <Tabs value={viewMode} className="w-full">
            <TabsContent value="list" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No events found</h3>
                  <p className="text-muted-foreground mb-4">Try adjusting your filters or search terms</p>
                  <Button onClick={clearFilters}>Clear all filters</Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="map" className="mt-0">
              <EventMap events={filteredEvents} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
