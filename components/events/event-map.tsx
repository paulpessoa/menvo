"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Monitor, Calendar, Users } from 'lucide-react'
import { format } from "date-fns"
import { Loader2Icon } from 'lucide-react'
import type { Event } from "@/types/events"

interface EventMapProps {
  events: {
    id: string;
    title: string;
    location: string;
    lat?: number; // Latitude
    lng?: number; // Longitude
    start_date: string;
    current_attendees: number;
    type: string;
    format: string;
    is_free: boolean;
  }[];
}

export default function EventMap({ events }: EventMapProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMap = useRef<google.maps.Map | null>(null)
  const markers = useRef<google.maps.Marker[]>([])
  const infoWindow = useRef<google.maps.InfoWindow | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.google || !window.google.maps) {
      console.warn('Google Maps API not loaded. Ensure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set and script is loaded.')
      return
    }

    if (mapRef.current && !googleMap.current) {
      const defaultCenter = { lat: -23.55052, lng: -46.633309 } // São Paulo, Brazil
      googleMap.current = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 10,
        mapId: 'YOUR_MAP_ID', // Optional: Use a Cloud-based map style ID
      })
      infoWindow.current = new window.google.maps.InfoWindow()
    }

    // Clear existing markers
    markers.current.forEach(marker => marker.setMap(null))
    markers.current = []

    // Add new markers for events with lat/lng
    events.forEach(event => {
      if (event.lat && event.lng) {
        const marker = new window.google.maps.Marker({
          position: { lat: event.lat, lng: event.lng },
          map: googleMap.current,
          title: event.title,
        })

        marker.addListener('click', () => {
          if (infoWindow.current) {
            infoWindow.current.setContent(`
              <div class="p-2">
                <h3 class="font-semibold text-base">${event.title}</h3>
                <p class="text-sm text-muted-foreground">${event.location}</p>
              </div>
            `)
            infoWindow.current.open(googleMap.current, marker)
          }
        })
        markers.current.push(marker)
      }
    })

    // If no events with lat/lng, try to geocode locations (requires Geocoding API enabled)
    if (events.some(e => !e.lat || !e.lng) && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      const geocoder = new window.google.maps.Geocoder()
      events.forEach((event, index) => {
        if (!event.lat || !event.lng) {
          geocoder.geocode({ address: event.location }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const { lat, lng } = results[0].geometry.location
              const newMarker = new window.google.maps.Marker({
                position: { lat: lat(), lng: lng() },
                map: googleMap.current,
                title: event.title,
              })
              newMarker.addListener('click', () => {
                if (infoWindow.current) {
                  infoWindow.current.setContent(`
                    <div class="p-2">
                      <h3 class="font-semibold text-base">${event.title}</h3>
                      <p class="text-sm text-muted-foreground">${event.location}</p>
                    </div>
                  `)
                  infoWindow.current.open(googleMap.current, newMarker)
                }
              })
              markers.current.push(newMarker)
              // Optionally update the event object with lat/lng for future use
              // events[index].lat = lat();
              // events[index].lng = lng();
            } else {
              console.warn(`Geocoding failed for ${event.location}: ${status}`)
            }
          })
        }
      })
    }

    // Simulate map loading
    const timer = setTimeout(() => setMapLoaded(true), 1000)
    return () => clearTimeout(timer)
  }, [events])

  if (!mapLoaded || typeof window === 'undefined' || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground mt-2 text-center">
          Carregando mapa... <br /> (Verifique se a chave da API do Google Maps está configurada)
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
      {/* Map Container */}
      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Event Locations ({events.length} events)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[500px] relative">
          {/* Placeholder for actual map implementation */}
          <div ref={mapRef} className="w-full h-full bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
            {markers.current.map(marker => (
              <div key={marker.title} className="absolute rounded-full h-8 w-8 p-0 ring-2 ring-primary ring-offset-2">
                <MapPin className="h-4 w-4" />
              </div>
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
              <p className="text-muted-foreground text-sm">{selectedEvent.location}</p>

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
