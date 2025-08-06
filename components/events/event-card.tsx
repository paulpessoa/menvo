import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPinIcon, CalendarIcon, ClockIcon } from 'lucide-react'
import Image from 'next/image'

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    image: string;
  };
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Card className="flex flex-col md:flex-row overflow-hidden">
      <div className="relative w-full md:w-1/3 h-48 md:h-auto">
        <Image
          src={event.image || '/placeholder.svg?height=200&width=300&query=event'}
          alt={event.title}
          layout="fill"
          objectFit="cover"
          className="rounded-t-lg md:rounded-l-lg md:rounded-t-none"
        />
      </div>
      <div className="flex flex-col p-6 flex-grow">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-2xl font-bold">{event.title}</CardTitle>
          <CardDescription className="text-muted-foreground">{event.description}</CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-grow space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{new Date(event.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <ClockIcon className="mr-2 h-4 w-4" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPinIcon className="mr-2 h-4 w-4" />
            <span>{event.location}</span>
          </div>
        </CardContent>
        <CardFooter className="p-0 mt-4">
          <Button className="w-full md:w-auto">Ver Detalhes</Button>
        </CardFooter>
      </div>
    </Card>
  )
}
