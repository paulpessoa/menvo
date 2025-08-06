'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2Icon, SearchIcon, MapPinIcon, CalendarIcon, FilterIcon, RefreshCcwIcon } from 'lucide-react'
import { EventCard } from '@/components/events/event-card'
import { EventFilters } from '@/components/events/event-filters'
import { EventCalendar } from '@/components/events/event-calendar'
import { EventMap } from '@/components/events/event-map'
import { useTranslation } from 'react-i18next'
import { fetchEvents } from '@/services/events/events'
import { toast } from '@/components/ui/use-toast'
import { mockEvents } from '@/data/mock-eventss' // Using mock data for now

export default function EventsPage() {
  const { t } = useTranslation()
  const [events, setEvents] = useState<typeof mockEvents>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined)
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'map'>('list') // 'list', 'calendar', 'map'

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true)
      try {
        // In a real app, you'd fetch from an API:
        // const { data, error } = await fetchEvents();
        // if (error) throw error;
        // setEvents(data);
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
        setEvents(mockEvents) // Use mock data
      } catch (error: any) {
        toast({
          title: t('events.fetchErrorTitle'),
          description: error.message || t('events.fetchErrorDescription'),
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    loadEvents()
  }, [t])

  const filteredEvents = useMemo(() => {
    let filtered = events

    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter((event) => event.category === filterCategory)
    }

    if (filterDate) {
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.date)
        return (
          eventDate.getFullYear() === filterDate.getFullYear() &&
          eventDate.getMonth() === filterDate.getMonth() &&
          eventDate.getDate() === filterDate.getDate()
        )
      })
    }

    return filtered
  }, [events, searchTerm, filterCategory, filterDate])

  const categories = useMemo(() => {
    const uniqueCategories = new Set(mockEvents.map(event => event.category))
    return ['all', ...Array.from(uniqueCategories)]
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">
        {t('events.title')}
      </h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('events.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <EventFilters
          categories={categories}
          selectedCategory={filterCategory}
          onSelectCategory={setFilterCategory}
          selectedDate={filterDate}
          onSelectDate={setFilterDate}
        />
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            size="sm"
          >
            {t('events.listView')}
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
            size="sm"
          >
            <CalendarIcon className="h-4 w-4 mr-2" /> {t('events.calendarView')}
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            onClick={() => setViewMode('map')}
            size="sm"
          >
            <MapPinIcon className="h-4 w-4 mr-2" /> {t('events.mapView')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2Icon className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t('events.loadingEvents')}</span>
        </div>
      ) : (
        <>
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground">
                  {t('events.noEventsFound')}
                </p>
              ) : (
                filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </div>
          )}
          {viewMode === 'calendar' && (
            <EventCalendar events={filteredEvents} />
          )}
          {viewMode === 'map' && (
            <EventMap events={filteredEvents} />
          )}
        </>
      )}
    </div>
  )
}
