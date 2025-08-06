"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, User, MessageSquare } from 'lucide-react'
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useRequestSession } from "@/hooks/useMentorship"
import { type MentorAvailability } from "@/services/mentorship/mentorship"
import { mentorshipUtils } from "@/services/mentorship/mentorship"

interface ScheduleSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  mentorId: string
  mentorName: string
  availability: MentorAvailability[]
  date?: Date
  time?: string
  message?: string
}

export function ScheduleSessionModal({
  isOpen,
  onClose,
  onConfirm,
  mentorId,
  mentorName,
  availability,
  date,
  time,
  message,
}: ScheduleSessionModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(time || "")
  const [topic, setTopic] = useState("")
  const [description, setDescription] = useState("")
  const [menteeNotes, setMenteeNotes] = useState("")

  const requestSessionMutation = useRequestSession()

  // Gerar slots de horário disponíveis para a data selecionada
  const getAvailableTimeSlots = (date: Date) => {
    if (!date) return []
    
    const dayOfWeek = date.getDay()
    const dayAvailability = availability.filter(slot => slot.day_of_week === dayOfWeek)
    
    return mentorshipUtils.generateTimeSlots(dayAvailability, 60) // 60 minutos por sessão
  }

  const availableTimeSlots = selectedDate ? getAvailableTimeSlots(selectedDate) : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDate || !selectedTimeSlot || !topic.trim()) {
      return
    }

    const [startTime, endTime] = selectedTimeSlot.split(' - ')
    
    try {
      await requestSessionMutation.mutateAsync({
        mentor_id: mentorId,
        requested_date: format(selectedDate, 'yyyy-MM-dd'),
        requested_start_time: startTime,
        requested_end_time: endTime,
        topic: topic.trim(),
        description: description.trim() || undefined,
        mentee_notes: menteeNotes.trim() || undefined,
        timezone: 'America/Sao_Paulo'
      })
      
      // Reset form and close modal
      setSelectedDate(undefined)
      setSelectedTimeSlot("")
      setTopic("")
      setDescription("")
      setMenteeNotes("")
      onConfirm()
    } catch (error) {
      console.error('Erro ao solicitar sessão:', error)
    }
  }

  const handleClose = () => {
    setSelectedDate(undefined)
    setSelectedTimeSlot("")
    setTopic("")
    setDescription("")
    setMenteeNotes("")
    onClose()
  }

  // Verificar se uma data tem disponibilidade
  const isDateAvailable = (date: Date) => {
    const dayOfWeek = date.getDay()
    return availability.some(slot => slot.day_of_week === dayOfWeek && slot.is_active)
  }

  // Desabilitar datas passadas e sem disponibilidade
  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today || !isDateAvailable(date)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {selectedDate && selectedTimeSlot && topic && message ? (
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Mentor:</p>
                <p className="text-muted-foreground">{mentorName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Data:</p>
                <p className="text-muted-foreground">{format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Horário:</p>
                <p className="text-muted-foreground">{selectedTimeSlot}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-medium">Sua Mensagem:</p>
                <p className="text-muted-foreground break-words">{message}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Data da Sessão</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date)
                      setSelectedTimeSlot("") // Reset time slot when date changes
                    }}
                    disabled={isDateDisabled}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Slot Selection */}
            {selectedDate && (
              <div className="space-y-2">
                <Label>Horário Disponível</Label>
                {availableTimeSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {availableTimeSlots.map((slot, index) => {
                      const timeSlotValue = `${slot.time} - ${slot.endTime}`
                      return (
                        <Button
                          key={index}
                          type="button"
                          variant={selectedTimeSlot === timeSlotValue ? "default" : "outline"}
                          className="justify-start"
                          onClick={() => setSelectedTimeSlot(timeSlotValue)}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          {timeSlotValue}
                        </Button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum horário disponível para esta data</p>
                    <p className="text-sm">Tente selecionar outra data</p>
                  </div>
                )}
              </div>
            )}

            {/* Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic">Tópico da Mentoria *</Label>
              <Input
                id="topic"
                placeholder="Ex: Transição de carreira, Preparação para entrevistas..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descreva brevemente o que você gostaria de discutir na sessão..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Mentee Notes */}
            <div className="space-y-2">
              <Label htmlFor="menteeNotes">Informações Adicionais (Opcional)</Label>
              <Textarea
                id="menteeNotes"
                placeholder="Compartilhe qualquer contexto adicional que possa ajudar o mentor a se preparar..."
                value={menteeNotes}
                onChange={(e) => setMenteeNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Availability Summary */}
            {availability.length > 0 && (
              <div className="space-y-2">
                <Label>Disponibilidade Geral do Mentor</Label>
                <div className="flex flex-wrap gap-2">
                  {availability.map((slot) => (
                    <Badge key={slot.id} variant="secondary" className="text-xs">
                      {mentorshipUtils.getDayName(slot.day_of_week)}: {' '}
                      {mentorshipUtils.formatTime(slot.start_time)} - {mentorshipUtils.formatTime(slot.end_time)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={handleClose}>
          Cancelar
        </Button>
        {selectedDate && selectedTimeSlot && topic && message ? (
          <Button onClick={onConfirm}>Confirmar Agendamento</Button>
        ) : (
          <Button 
            type="submit" 
            disabled={!selectedDate || !selectedTimeSlot || !topic.trim() || requestSessionMutation.isPending}
          >
            {requestSessionMutation.isPending ? 'Enviando...' : 'Solicitar Mentoria'}
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  )
}
