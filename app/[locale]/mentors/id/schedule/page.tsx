"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  User,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react"
import { useMentor } from "@/hooks/useMentors"
import { useAuth } from "@/lib/auth"
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { format, addDays, isBefore, isAfter } from "date-fns"
import { ptBR } from "date-fns/locale"

interface SchedulePageProps {
  params: { id: string }
}

interface TimeSlot {
  time: string
  available: boolean
  reason?: string
}

export default function SchedulePage({ params }: SchedulePageProps) {
  const t = useTranslations()
  const { user } = useAuth()
  const router = useRouter()
  const { data: mentor, isLoading, error } = useMentor(params.id)

  const [showLoginModal, setShowLoginModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [topic, setTopic] = useState("")
  const [description, setDescription] = useState("")
  const [menteeNotes, setMenteeNotes] = useState("")

  const getAvailableTimeSlots = (date: Date): TimeSlot[] => {
    const dayOfWeek = date.getDay()
    const baseSlots = [
      "09:00",
      "10:00",
      "11:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00"
    ]
    const availability_status: Record<number, string[]> = {
      1: ["09:00", "10:00", "11:00", "14:00"],
      2: ["14:00", "15:00", "16:00", "17:00"],
      3: ["09:00", "10:00", "14:00", "15:00"],
      4: ["16:00", "17:00", "18:00", "19:00"],
      5: ["09:00", "10:00", "11:00", "14:00"],
      6: ["09:00", "10:00"],
      0: []
    }
    const availableTimes = availability_status[dayOfWeek] || []
    return baseSlots.map((time) => ({
      time,
      available: availableTimes.includes(time),
      reason: !availableTimes.includes(time)
        ? "Horário indisponível"
        : undefined
    }))
  }

  const handleTimeSlotSelect = (time: string) => {
    if (!user) {
      setShowLoginModal(true)
      return
    }
    setSelectedTimeSlot(time)
  }

  const handleSubmitRequest = async () => {
    if (!selectedDate || !selectedTimeSlot || !user) return
    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success("Solicitação enviada com sucesso!")
      router.push(`/mentors/${params.id}`)
    } catch (e) {
      toast.error("Erro ao enviar solicitação")
    } finally {
      setIsSubmitting(false)
      setShowConfirmDialog(false)
    }
  }

  useEffect(() => {
    if (!user) setShowLoginModal(true)
  }, [user])

  if (isLoading) return <ScheduleSkeleton />
  if (error || !mentor) notFound()
  if (mentor.availability_status !== "available") {
    return (
      <div className="container py-12 text-center">
        <AlertCircle className="h-8 w-8 mx-auto text-yellow-600 mb-4" />
        <h1 className="text-2xl font-bold">Mentor Indisponível</h1>
        <Button onClick={() => router.back()} className="mt-4">
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8 md:py-12 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <h1 className="text-2xl font-bold">Agendar com {mentor.first_name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data e Horário</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                disabled={(d) =>
                  isBefore(d, new Date()) || isAfter(d, addDays(new Date(), 30))
                }
              />
              {selectedDate && (
                <div className="grid grid-cols-3 gap-2 mt-6">
                  {getAvailableTimeSlots(selectedDate).map((s) => (
                    <Button
                      key={s.time}
                      variant={
                        selectedTimeSlot === s.time ? "default" : "outline"
                      }
                      disabled={!s.available}
                      onClick={() => handleTimeSlotSelect(s.time)}
                    >
                      {s.time}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedTimeSlot && (
            <Card>
              <CardHeader>
                <CardTitle>Detalhes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tópico</Label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={!selectedDate || !selectedTimeSlot || !topic}
                className="w-full"
              >
                Confirmar Agendamento
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tudo certo?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleSubmitRequest} disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Sim, solicitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        mentorName={`${mentor.first_name} ${mentor.last_name}`}
      />
    </div>
  )
}

function ScheduleSkeleton() {
  return (
    <div className="container py-12">
      <Skeleton className="h-12 w-64 mb-8" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
