"use client"

import { useState } from "react"
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { PlusIcon } from 'lucide-react'
import { format } from "date-fns"
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface Event {
  id: string
  title: string
  date: Date
  time: string
  location: string
  description?: string
}

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Sessão de Mentoria com João',
      date: new Date(2025, 7, 15, 10, 0), // August 15, 2025, 10:00 AM
      time: '10:00 AM',
      location: 'Online (Google Meet)',
      description: 'Sessão de acompanhamento sobre desenvolvimento de carreira.',
    },
    {
      id: '2',
      title: 'Webinar: Tendências em IA',
      date: new Date(2025, 7, 20, 14, 0), // August 20, 2025, 2:00 PM
      time: '02:00 PM',
      location: 'Online (Zoom)',
      description: 'Discussão sobre as últimas tendências e aplicações de Inteligência Artificial.',
    },
  ])
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    date: date,
    time: '',
    location: '',
    description: '',
  })

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.location) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos do evento.',
        variant: 'destructive',
      })
      return
    }

    const newId = (events.length + 1).toString()
    setEvents((prev) => [
      ...prev,
      {
        id: newId,
        title: newEvent.title!,
        date: newEvent.date!,
        time: newEvent.time!,
        location: newEvent.location!,
        description: newEvent.description || '',
      },
    ])
    toast({
      title: 'Evento Adicionado!',
      description: 'Seu novo evento foi adicionado ao calendário.',
      variant: 'default',
    })
    setIsAddEventModalOpen(false)
    setNewEvent({ title: '', date: date, time: '', location: '', description: '' }) // Reset form
  }

  const filteredEvents = events.filter(event =>
    date && event.date.toDateString() === date.toDateString()
  ).sort((a, b) => {
    const timeA = new Date(`1970/01/01 ${a.time}`)
    const timeB = new Date(`1970/01/01 ${b.time}`)
    return timeA.getTime() - timeB.getTime()
  })

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">Meu Calendário</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="lg:col-span-1">
            <Card className="p-6">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border shadow w-full"
              />
              <Button onClick={() => setIsAddEventModalOpen(true)} className="w-full mt-4">
                <PlusIcon className="mr-2 h-4 w-4" /> Adicionar Novo Evento
              </Button>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Eventos em {date?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</CardTitle>
                <CardDescription>Seus compromissos e eventos agendados.</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredEvents.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum evento para esta data.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredEvents.map((event) => (
                      <div key={event.id} className="border rounded-md p-4">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {event.time} - {event.location}
                        </p>
                        <p className="text-sm mt-1">{event.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      <Dialog open={isAddEventModalOpen} onOpenChange={setIsAddEventModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Evento</DialogTitle>
            <DialogDescription>Preencha os detalhes para adicionar um evento ao seu calendário.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="event-title">Título do Evento</Label>
              <Input
                id="event-title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-date">Data</Label>
              <Input
                id="event-date"
                type="date"
                value={newEvent.date?.toISOString().split('T')[0] || ''}
                onChange={(e) => setNewEvent({ ...newEvent, date: new Date(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-time">Horário</Label>
              <Input
                id="event-time"
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-location">Local</Label>
              <Input
                id="event-location"
                placeholder="Online (Zoom), Escritório, etc."
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-description">Descrição (Opcional)</Label>
              <Textarea
                id="event-description"
                placeholder="Detalhes do evento..."
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEventModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddEvent}>Adicionar Evento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}
