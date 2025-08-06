"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock, DollarSign, ExternalLink } from 'lucide-react'
import { Event } from "@/types/events"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  const formattedDate = format(new Date(event.start_date), "dd 'de' MMMM, yyyy", { locale: ptBR })

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative h-48 w-full">
        <Image
          src={event.image_url || "/placeholder.svg?height=200&width=400&text=Event Image"}
          alt={event.title}
          fill
          className="object-cover"
        />
        <Badge className="absolute top-3 left-3 text-xs px-2 py-1">
          {event.type}
        </Badge>
        {event.is_free && (
          <Badge className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1">
            Gratuito
          </Badge>
        )}
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold line-clamp-2">{event.title}</CardTitle>
        <CardDescription className="line-clamp-2">{event.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{event.time}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>{event.location}</span>
        </div>
        {!event.is_free && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>R$ {event.price.toFixed(2)}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-1 pt-2">
          <Badge variant="outline">{event.format}</Badge>
          <Badge variant="secondary">{event.source}</Badge>
          {event.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-4">
        <Link href={event.link} target="_blank" rel="noopener noreferrer" className="w-full">
          <Button className="w-full">
            Ver Detalhes <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
