import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, MapPin, Monitor, Users, ExternalLink, Star, DollarSign } from "lucide-react"
import { format } from "date-fns"
import type { Event } from "@/types/events"

interface EventCardProps {
  event: Event
}

const eventTypeColors = {
  course: "bg-blue-100 text-blue-800",
  workshop: "bg-green-100 text-green-800",
  hackathon: "bg-purple-100 text-purple-800",
  lecture: "bg-orange-100 text-orange-800",
  seminar: "bg-red-100 text-red-800",
  webinar: "bg-cyan-100 text-cyan-800",
  conference: "bg-indigo-100 text-indigo-800",
  networking: "bg-pink-100 text-pink-800",
}

const formatTypeColors = {
  virtual: "bg-blue-50 text-blue-700 border-blue-200",
  "in-person": "bg-green-50 text-green-700 border-green-200",
  hybrid: "bg-purple-50 text-purple-700 border-purple-200",
}

export default function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.start_date)
  const isMultiDay = event.start_date !== event.end_date

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={event.image_url || `/placeholder.svg?height=200&width=400&text=${event.type}`}
            alt={event.title}
            fill
            className="object-cover"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={eventTypeColors[event.type]}>
              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
            </Badge>
            {event.source === "external" && (
              <Badge variant="outline" className="bg-white/90">
                <ExternalLink className="h-3 w-3 mr-1" />
                External
              </Badge>
            )}
          </div>
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className={`${formatTypeColors[event.format]} bg-white/90`}>
              {event.format === "virtual" && <Monitor className="h-3 w-3 mr-1" />}
              {event.format === "in-person" && <MapPin className="h-3 w-3 mr-1" />}
              {event.format === "hybrid" && <Star className="h-3 w-3 mr-1" />}
              {event.format.charAt(0).toUpperCase() + event.format.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2 mb-2">{event.title}</h3>
            <p className="text-muted-foreground text-sm line-clamp-2">{event.description}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(eventDate, "MMM dd, yyyy")}
                {isMultiDay && ` - ${format(new Date(event.end_date), "MMM dd, yyyy")}`}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {event.start_time} - {event.end_time}
              </span>
            </div>

            {event.format !== "virtual" && event.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {event.current_attendees}
                {event.max_attendees && ` / ${event.max_attendees}`} attendees
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={event.organizer_avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">{event.organizer.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">by {event.organizer}</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {event.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {event.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{event.tags.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {event.is_free ? (
            <Badge variant="outline" className="text-green-600 border-green-600">
              Free
            </Badge>
          ) : (
            <div className="flex items-center gap-1 text-lg font-semibold">
              <DollarSign className="h-4 w-4" />
              <span>{event.price}</span>
            </div>
          )}
        </div>

        <Button size="sm" asChild>
          <Link href={`/events/${event.id}`}>{event.source === "external" ? "Learn More" : "Register"}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
