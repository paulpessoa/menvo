"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Monitor, Calendar, Users } from "lucide-react"
import { format } from "date-fns"
import type { Event } from "@/types/events"

interface EventMapProps {
  events: Event[]
}

export default function EventMap({ events }: EventMapProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Filter events that have coordinates (in-person or hybrid)
  const mappableEvents = events.filter(
    (event) => event.coordinates && (event.format === "in-person" || event.format === "hybrid"),
  )

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => setMapLoaded(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (!mapLoaded) {
    return (
      <Card className="h-[600px]">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
      {/* Map Container */}
      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Event Locations ({mappableEvents.length} events)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[500px] relative">
          {/* Placeholder for actual map implementation */}
          <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Interactive Map</p>
              <p className="text-sm text-muted-foreground">Google Maps integration would be implemented here</p>
            </div>

            {/* Simulated map pins */}
            {mappableEvents.slice(0, 5).map((event, index) => (
              <Button
                key={event.id}
                variant="default"
                size="sm"
                className={`absolute rounded-full h-8 w-8 p-0 ${
                  selectedEvent?.id === event.id ? "ring-2 ring-primary ring-offset-2" : ""
                }`}
                style={{
                  left: `${20 + index * 15}%`,
                  top: `${30 + index * 10}%`,
                }}
                onClick={() => setSelectedEvent(event)}
              >
                <MapPin className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Details Sidebar */}
      <div className="space-y-4">
        {selectedEvent ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{selectedEvent.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">{selectedEvent.description}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(selectedEvent.start_date), "MMM dd, yyyy")}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedEvent.location}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>{selectedEvent.current_attendees} attendees</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{selectedEvent.type}</Badge>
                <Badge variant="outline">{selectedEvent.format}</Badge>
                {selectedEvent.is_free && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Free
                  </Badge>
                )}
              </div>

              <Button className="w-full">View Details</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-48">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Click on a map pin to view event details</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Virtual Events List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Virtual Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events
                .filter((event) => event.format === "virtual")
                .slice(0, 3)
                .map((event) => (
                  <div key={event.id} className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm mb-1">{event.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {format(new Date(event.start_date), "MMM dd")} • {event.start_time}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {event.type}
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
