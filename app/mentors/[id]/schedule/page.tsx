"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, CalendarIcon, Clock, User, MessageSquare, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useMentor } from "@/hooks/useMentors"
import { useAuth } from "@/hooks/useAuth"
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { format, addDays, isSameDay, isBefore, isAfter } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScheduleSessionModal } from '@/components/mentorship/ScheduleSessionModal'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface SchedulePageProps {
  params: { id: string }
}

interface TimeSlot {
  time: string
  available: boolean
  reason?: string
}

interface SessionRequest {
  mentorId: string
  date: Date
  startTime: string
  endTime: string
  topic: string
  description: string
  menteeNotes?: string
}

export default function SchedulePage({ params }: SchedulePageProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const { data: mentor, isLoading, error } = useMentor(params.id)
  
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form fields
  const [topic, setTopic] = useState("")
  const [description, setDescription] = useState("")
  const [menteeNotes, setMenteeNotes] = useState("")

  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined)
  const [message, setMessage] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Mock availability data - in real app, this would come from API
  const getAvailableTimeSlots = (date: Date): TimeSlot[] => {
    const dayOfWeek = date.getDay()
    const baseSlots = [
      "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
    ]
    
    // Mock different availability based on day of week
    const availability = {
      1: ["09:00", "10:00", "11:00", "14:00"], // Monday
      2: ["14:00", "15:00", "16:00", "17:00"], // Tuesday
      3: ["09:00", "10:00", "14:00", "15:00"], // Wednesday
      4: ["16:00", "17:00", "18:00", "19:00"], // Thursday
      5: ["09:00", "10:00", "11:00", "14:00"], // Friday
      6: ["09:00", "10:00"], // Saturday
      0: [] // Sunday - not available
    }

    const availableTimes = availability[dayOfWeek as keyof typeof availability] || []
    
    return baseSlots.map(time => ({
      time,
      available: availableTimes.includes(time),
      reason: !availableTimes.includes(time) ? "Horário indisponível" : undefined
    }))
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedTimeSlot(null)
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
      const endTime = `${parseInt(selectedTimeSlot.split(':')[0]) + 1}:${selectedTimeSlot.split(':')[1]}`
      
      const sessionRequest: SessionRequest = {
        mentorId: params.id,
        date: selectedDate,
        startTime: selectedTimeSlot,
        endTime,
        topic: topic.trim(),
        description: description.trim(),
        menteeNotes: menteeNotes.trim() || undefined
      }

      // TODO: Replace with actual API call
      console.log('Session request:', sessionRequest)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success("Solicitação enviada com sucesso!", {
        description: "O mentor receberá sua solicitação e responderá em breve."
      })
      
      // Redirect to sessions page or profile
      router.push(`/mentors/${params.id}`)
      
    } catch (error) {
      toast.error("Erro ao enviar solicitação", {
        description: "Tente novamente mais tarde."
      })
    } finally {
      setIsSubmitting(false)
      setShowConfirmDialog(false)
    }
  }

  const handleSchedule = () => {
    if (!date || !selectedTime || !message.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, selecione uma data, um horário e escreva uma mensagem.',
        variant: 'destructive',
      })
      return
    }
    setIsModalOpen(true)
  }

  const confirmSchedule = async () => {
    // Here you would integrate with your backend to actually schedule the session
    // For now, it's a mock success
    console.log('Scheduling session with:', mentor?.first_name)
    console.log('Date:', date?.toDateString())
    console.log('Time:', selectedTime)
    console.log('Message:', message)

    toast({
      title: 'Sessão Agendada!',
      description: `Sua sessão com ${mentor?.first_name} em ${date?.toLocaleDateString()} às ${selectedTime} foi solicitada.`,
      variant: 'default',
    })
    setIsModalOpen(false)
    router.push('/dashboard') // Redirect to dashboard or a confirmation page
  }

  const canSchedule = () => {
    return user && selectedDate && selectedTimeSlot && topic.trim().length > 0
  }

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      setShowLoginModal(true)
    }
  }, [user])

  useEffect(() => {
    if (!mentor) {
      notFound()
    }
  }, [mentor])

  if (isLoading) {
    return <ScheduleSkeleton />
  }

  if (error || !mentor) {
    notFound()
  }

  if (mentor.availability !== 'available') {
    return (
      <div className="container py-8 md:py-12">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertCircle className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Mentor Indisponível</h1>
          </div>
          <p className="text-muted-foreground">
            {mentor.first_name} {mentor.last_name} está temporariamente indisponível para agendamentos.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Perfil
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['mentee']}>
      <div className="container py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Agendar Sessão de Mentoria</h1>
              <p className="text-muted-foreground">
                Agende uma sessão com {mentor.first_name} {mentor.last_name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            {/* Main Content */}
            <div className="space-y-6">
              {/* Mentor Info */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 rounded-full overflow-hidden bg-muted">
                      {mentor.avatar_url ? (
                        <Image
                          src={mentor.avatar_url || "/placeholder.svg"}
                          alt={`${mentor.first_name} ${mentor.last_name}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <User className="h-8 w-8 text-primary/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold">
                        {mentor.first_name} {mentor.last_name}
                      </h2>
                      {mentor.current_position && (
                        <p className="text-muted-foreground">{mentor.current_position}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {mentor.mentor_skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Date Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Selecione uma Data
                  </CardTitle>
                  <CardDescription>
                    Escolha um dia disponível para sua sessão de mentoria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => 
                      isBefore(date, new Date()) || 
                      isAfter(date, addDays(new Date(), 30)) ||
                      date.getDay() === 0 // Disable Sundays
                    }
                    locale={ptBR}
                    className="rounded-md border"
                  />
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Informações importantes:</p>
                        <ul className="mt-1 space-y-1 text-xs">
                          <li>• Você pode agendar com até 30 dias de antecedência</li>
                          <li>• Domingos não estão disponíveis</li>
                          <li>• A disponibilidade varia por dia da semana</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Time Selection */}
              {selectedDate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Horários Disponíveis
                    </CardTitle>
                    <CardDescription>
                      {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {getAvailableTimeSlots(selectedDate).map(({ time, available, reason }) => (
                        <Button
                          key={time}
                          variant={selectedTimeSlot === time ? "default" : available ? "outline" : "ghost"}
                          disabled={!available}
                          onClick={() => available && handleTimeSlotSelect(time)}
                          className={`h-12 ${!available ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={reason}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                    {getAvailableTimeSlots(selectedDate).every(slot => !slot.available) && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum horário disponível nesta data</p>
                        <p className="text-sm">Tente selecionar outra data</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Session Details Form */}
              {selectedTimeSlot && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Detalhes da Sessão
                    </CardTitle>
                    <CardDescription>
                      Conte ao mentor sobre o que você gostaria de discutir
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="topic">Tópico Principal *</Label>
                      <Input
                        id="topic"
                        placeholder="Ex: Transição de carreira, Preparação para entrevistas..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        maxLength={100}
                      />
                      <p className="text-xs text-muted-foreground">
                        {topic.length}/100 caracteres
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição *</Label>
                      <Textarea
                        id="description"
                        placeholder="Descreva mais detalhadamente o que você gostaria de discutir na sessão..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        maxLength={500}
                      />
                      <p className="text-xs text-muted-foreground">
                        {description.length}/500 caracteres
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Informações Adicionais</Label>
                      <Textarea
                        id="notes"
                        placeholder="Alguma informação adicional que o mentor deveria saber? (opcional)"
                        value={menteeNotes}
                        onChange={(e) => setMenteeNotes(e.target.value)}
                        rows={3}
                        maxLength={300}
                      />
                      <p className="text-xs text-muted-foreground">
                        {menteeNotes.length}/300 caracteres
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* New Time Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Horários Disponíveis</h3>
                <Select onValueChange={setSelectedTime} value={selectedTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTimeSlots(selectedDate || new Date()).map(({ time, available }) => (
                      <SelectItem key={time} value={time} disabled={!available}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* New Message Input */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Sua Mensagem para o Mentor</h3>
                <Textarea
                  placeholder="Descreva o que você gostaria de discutir na sessão..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                />
              </div>

              {/* New Schedule Button */}
              <Button className="w-full" onClick={handleSchedule}>
                Solicitar Sessão
              </Button>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Agendamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mentor:</span>
                      <span className="font-medium">
                        {mentor.first_name} {mentor.last_name}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data:</span>
                      <span className="font-medium">
                        {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "-"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Horário:</span>
                      <span className="font-medium">
                        {selectedTimeSlot ? `${selectedTimeSlot} - ${parseInt(selectedTimeSlot.split(':')[0]) + 1}:${selectedTimeSlot.split(':')[1]}` : "-"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duração:</span>
                      <span className="font-medium">45 minutos</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Preço:</span>
                      <span className="font-medium text-green-600">Gratuito</span>
                    </div>
                  </div>

                  <Separator />

                  <Button 
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={!canSchedule()}
                    className="w-full"
                  >
                    Solicitar Agendamento
                  </Button>
                  
                  {!user && (
                    <p className="text-xs text-muted-foreground text-center">
                      Faça login para agendar
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Como Funciona</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium">Envie sua solicitação</p>
                      <p className="text-xs text-muted-foreground">
                        Sua solicitação será enviada ao mentor
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium">Aguarde confirmação</p>
                      <p className="text-xs text-muted-foreground">
                        O mentor responderá em até 24 horas
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium">Receba o link</p>
                      <p className="text-xs text-muted-foreground">
                        Link da videochamada será enviado por email
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Agendamento</DialogTitle>
            <DialogDescription>
              Revise os detalhes da sua sessão antes de enviar a solicitação
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p><strong>Mentor:</strong> {mentor.first_name} {mentor.last_name}</p>
              <p><strong>Data:</strong> {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
              <p><strong>Horário:</strong> {selectedTimeSlot} - {selectedTimeSlot && `${parseInt(selectedTimeSlot.split(':')[0]) + 1}:${selectedTimeSlot.split(':')[1]}`}</p>
              <p><strong>Tópico:</strong> {topic}</p>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>
                <CheckCircle className="h-4 w-4 inline mr-2 text-green-600" />
                Sua solicitação será enviada ao mentor
              </p>
              <p>
                <CheckCircle className="h-4 w-4 inline mr-2 text-green-600" />
                Você receberá uma confirmação por email
              </p>
              <p>
                <CheckCircle className="h-4 w-4 inline mr-2 text-green-600" />
                O mentor tem até 24h para responder
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmitRequest}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Confirmar Agendamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login Required Modal */}
      <LoginRequiredModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        mentorName={`${mentor.first_name} ${mentor.last_name}`}
      />

      {/* Schedule Session Modal */}
      {mentor && date && selectedTime && (
        <ScheduleSessionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={confirmSchedule}
          mentorName={`${mentor.first_name} ${mentor.last_name}`}
          date={date}
          time={selectedTime}
          message={message}
        />
      )}
    </ProtectedRoute>
  )
}

function ScheduleSkeleton() {
  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-9 w-16" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
