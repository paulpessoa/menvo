"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, CheckCircle, Loader2 } from "lucide-react"
import {
  type MentorAvailability as AvailableTimeSlot,
  mentorshipUtils
} from "@/lib/services/mentorship/mentorship.service"
import { toast } from "sonner"

interface BookingFormProps {
  mentorId: string
  mentorName: string
  onSuccess?: (appointmentId: string) => void
  onCancel?: () => void
}

export default function BookingForm({
  mentorId,
  mentorName,
  onSuccess,
  onCancel
}: BookingFormProps) {
  const [availableSlots, setAvailableSlots] = useState<AvailableTimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<AvailableTimeSlot | null>(
    null
  )
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchingSlots, setFetchingSlots] = useState(true)

  // Fetch available slots
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setFetchingSlots(true)
        const response = await fetch(
          `/api/appointments/availability?mentor_id=${mentorId}`
        )
        if (!response.ok) {
          throw new Error("Failed to fetch availability")
        }
        const data = await response.json()
        setAvailableSlots(data.availableSlots || [])
      } catch (error) {
        console.error("Error fetching availability:", error)
        toast.error("Erro ao carregar horários disponíveis")
      } finally {
        setFetchingSlots(false)
      }
    }

    if (mentorId) {
      fetchAvailability()
    }
  }, [mentorId])

  const handleBooking = async () => {
    if (!selectedSlot) {
      toast.error("Selecione um horário")
      return
    }

    try {
      setLoading(true)

      // Calculate the next occurrence of the day_of_week
      const scheduledAt = mentorshipUtils.getNextOccurrence(
        selectedSlot.day_of_week,
        selectedSlot.start_time
      )

      const response = await fetch("/api/appointments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mentor_id: mentorId,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: 60,
          message: message.trim() || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create appointment")
      }

      const data = await response.json()
      toast.success("Agendamento criado com sucesso!")

      if (onSuccess) {
        onSuccess(data.appointment.id)
      }
    } catch (error) {
      console.error("Error creating appointment:", error)
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar agendamento"
      )
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5)
  }

  // Group slots by day
  const slotsByDay = availableSlots.reduce(
    (acc, slot) => {
      const day = slot.day_of_week
      if (!acc[day]) {
        acc[day] = []
      }
      acc[day].push(slot)
      return acc
    },
    {} as Record<number, AvailableTimeSlot[]>
  )

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-none border-none">
      <CardHeader className="px-0">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Calendar className="h-5 w-5 text-primary" />
          Agendar Mentoria
        </CardTitle>
        <CardDescription>
          Escolha um dos horários semanais de {mentorName}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-0">
        {/* Available Slots */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Horários Semanais
          </Label>

          {fetchingSlots ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-12 border rounded-xl bg-muted/30">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Nenhum horário disponível</p>
              <p className="text-sm text-muted-foreground">
                Este mentor ainda não configurou sua agenda.
              </p>
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              {[1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
                const daySlots = slotsByDay[dayNum] || []
                if (daySlots.length === 0) return null

                return (
                  <div key={dayNum} className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {mentorshipUtils.getDayName(dayNum)}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {daySlots.map((slot) => (
                        <Button
                          key={slot.id}
                          variant={
                            selectedSlot?.id === slot.id ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedSlot(slot)}
                          className="rounded-full px-4"
                        >
                          {formatTime(slot.start_time)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Selected Slot Display */}
        {selectedSlot && (
          <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
            <div className="flex items-center gap-3 text-sm">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-primary">
                  Próxima sessão disponível:
                </p>
                <p className="text-muted-foreground">
                  {mentorshipUtils.getDayName(selectedSlot.day_of_week)} às{" "}
                  {formatTime(selectedSlot.start_time)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        <div className="space-y-3">
          <Label
            htmlFor="message"
            className="text-sm font-medium text-muted-foreground uppercase tracking-wider"
          >
            O que você quer discutir?
          </Label>
          <Textarea
            id="message"
            placeholder="Ex: Gostaria de dicas para meu primeiro emprego na área..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-2 min-h-[100px] bg-muted/30 border-none focus-visible:ring-primary"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
          )}
          <Button
            onClick={handleBooking}
            disabled={!selectedSlot || loading}
            className="flex-1 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Agendamento
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
