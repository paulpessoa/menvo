'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Loader2, CalendarCheckIcon, ClockIcon, UserIcon } from 'lucide-react'
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isBefore, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { ScheduleSessionModal } from '@/components/mentorship/ScheduleSessionModal'
import { SessionDetailsModal } from '@/components/mentorship/SessionDetailsModal'
import { SessionResponseModal } from '@/components/mentorship/SessionResponseModal'
import { useAuth } from '@/hooks/useAuth'
import { useMentorship } from '@/hooks/useMentorship'
import { user_profile } from '@/types/database'
import Link from 'next/link'

interface MentorProfile extends user_profile {
  id: string;
  full_name: string;
  // Add any other fields needed for display or scheduling
}

async function fetchMentorProfile(id: string): Promise<MentorProfile> {
  const response = await fetch(`/api/mentors/${id}`)
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to fetch mentor profile')
  }
  const data = await response.json()
  return data.data
}

export default function MentorSchedulePage() {
  const params = useParams()
  const mentorId = params.id as string
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const {
    mentorAvailability,
    mentorSessions,
    requestMentorshipSession,
    respondToMentorshipSession,
    isLoading: mentorshipLoading,
    error: mentorshipError,
  } = useMentorship(mentorId, user?.id)

  const { data: mentor, isLoading: mentorLoading, isError: mentorError, error: mentorFetchError } = useQuery<MentorProfile, Error>({
    queryKey: ['mentorProfile', mentorId],
    queryFn: () => fetchMentorProfile(mentorId),
    enabled: !!mentorId,
  })

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | undefined>(undefined)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false)
  const [sessionToRespond, setSessionToRespond] = useState<any>(null) // Type this properly
  const [isSessionDetailsModalOpen, setIsSessionDetailsModalOpen] = useState(false)
  const [selectedSessionDetails, setSelectedSessionDetails] = useState<any>(null) // Type this properly

  const isLoading = authLoading || mentorLoading || mentorshipLoading

  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || !mentorAvailability) return []

    const dayOfWeek = format(selectedDate, 'EEEE', { locale: ptBR }).toLowerCase()
    const availabilityForDay = mentorAvailability.find(
      (slot) => slot.day_of_week.toLowerCase() === dayOfWeek
    )

    if (!availabilityForDay) return []

    const slots = []
    let currentTime = parseISO(`2000-01-01T${availabilityForDay.start_time}:00`)
    const endTime = parseISO(`2000-01-01T${availabilityForDay.end_time}:00`)

    while (currentTime < endTime) {
      const slotEnd = addDays(currentTime, 0) // Use addDays to avoid mutating currentTime directly
      const formattedSlot = format(currentTime, 'HH:mm')
      slots.push(formattedSlot)
      currentTime = addDays(currentTime, 0) // Advance by session duration, assuming 60 min for now
      currentTime.setMinutes(currentTime.getMinutes() + 60); // Add 60 minutes for next slot
    }

    // Filter out slots that are in the past for the selected date
    const now = new Date();
    return slots.filter(slot => {
      const [hours, minutes] = slot.split(':').map(Number);
      const slotDateTime = new Date(selectedDate);
      slotDateTime.setHours(hours, minutes, 0, 0);
      return !isBefore(slotDateTime, now);
    });
  }, [selectedDate, mentorAvailability])

  const handleRequestSession = async (menteeId: string, mentorId: string, scheduledTime: string, notes: string) => {
    if (!selectedDate || !selectedTimeSlot) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma data e um horário.',
        variant: 'destructive',
      })
      return
    }

    const sessionDateTime = new Date(selectedDate)
    const [hours, minutes] = selectedTimeSlot.split(':').map(Number)
    sessionDateTime.setHours(hours, minutes, 0, 0)

    try {
      await requestMentorshipSession({
        mentee_id: menteeId,
        mentor_id: mentorId,
        scheduled_time: sessionDateTime.toISOString(),
        notes,
        status: 'pending',
      })
      toast({
        title: 'Solicitação Enviada!',
        description: 'Sua solicitação de mentoria foi enviada ao mentor.',
      })
      setIsScheduleModalOpen(false)
      setSelectedTimeSlot(undefined)
    } catch (error: any) {
      toast({
        title: 'Erro ao solicitar mentoria',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      })
    }
  }

  const handleRespondSession = async (sessionId: string, status: 'accepted' | 'rejected', responseNotes?: string) => {
    try {
      await respondToMentorshipSession(sessionId, status, responseNotes)
      toast({
        title: 'Resposta Enviada!',
        description: `A sessão foi ${status === 'accepted' ? 'aceita' : 'rejeitada'} com sucesso.`,
      })
      setIsResponseModalOpen(false)
      setSessionToRespond(null)
    } catch (error: any) {
      toast({
        title: 'Erro ao responder à sessão',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      })
    }
  }

  const handleOpenSessionDetails = (session: any) => {
    setSelectedSessionDetails(session)
    setIsSessionDetailsModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando...</span>
      </div>
    )
  }

  if (mentorError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-3xl font-bold mb-4">Erro ao carregar mentor</h1>
        <p className="text-lg mb-6">{mentorFetchError?.message || 'Ocorreu um erro inesperado.'}</p>
        <Link href="/mentors" passHref>
          <Button>Voltar para a lista de mentores</Button>
        </Link>
      </div>
    )
  }

  if (!mentor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-3xl font-bold mb-4">Mentor não encontrado</h1>
        <p className="text-lg mb-6">O perfil do mentor que você está procurando não existe ou não está verificado.</p>
        <Link href="/mentors" passHref>
          <Button>Voltar para a lista de mentores</Button>
        </Link>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">
          Agendar Mentoria com {mentor.full_name}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar for Date Selection */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Selecione uma Data</CardTitle>
              <CardDescription>Escolha o dia para sua sessão de mentoria.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => isBefore(date, new Date())}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Time Slot Selection */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Selecione um Horário</CardTitle>
              <CardDescription>
                Horários disponíveis para {selectedDate ? format(selectedDate, 'PPP', { locale: ptBR }) : 'a data selecionada'}.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableTimeSlots.length > 0 ? (
                availableTimeSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedTimeSlot === slot ? 'default' : 'outline'}
                    onClick={() => setSelectedTimeSlot(slot)}
                    disabled={!isAuthenticated}
                  >
                    <ClockIcon className="mr-2 h-4 w-4" />
                    {slot}
                  </Button>
                ))
              ) : (
                <p className="col-span-full text-center text-muted-foreground">
                  Nenhum horário disponível para esta data ou o mentor não configurou sua disponibilidade.
                </p>
              )}
              {!isAuthenticated && (
                <p className="col-span-full text-center text-red-500 text-sm">
                  Você precisa estar logado para agendar uma sessão.
                </p>
              )}
            </CardContent>
            <CardContent className="pt-0">
              <Button
                className="w-full"
                onClick={() => setIsScheduleModalOpen(true)}
                disabled={!selectedDate || !selectedTimeSlot || !isAuthenticated}
              >
                <CalendarCheckIcon className="mr-2 h-4 w-4" />
                Solicitar Sessão
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Mentorship Sessions for this Mentor (if applicable) */}
        {mentorSessions && mentorSessions.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-6 text-center">
              Suas Sessões com {mentor.full_name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentorSessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarCheckIcon className="h-5 w-5" />
                      Sessão em {format(parseISO(session.scheduled_time), 'PPP - HH:mm', { locale: ptBR })}
                    </CardTitle>
                    <CardDescription>Status: <span className="capitalize">{session.status}</span></CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {session.notes || 'Sem notas adicionais.'}
                    </p>
                    <Button onClick={() => handleOpenSessionDetails(session)} variant="outline" className="w-full">
                      Ver Detalhes
                    </Button>
                    {session.status === 'pending' && user?.id === mentorId && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="default"
                          className="w-full"
                          onClick={() => { setSessionToRespond(session); setIsResponseModalOpen(true); }}
                        >
                          Responder
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Modals */}
        {mentor && user && selectedDate && selectedTimeSlot && (
          <ScheduleSessionModal
            isOpen={isScheduleModalOpen}
            onClose={() => setIsScheduleModalOpen(false)}
            mentor={mentor}
            menteeId={user.id}
            selectedDate={selectedDate}
            selectedTimeSlot={selectedTimeSlot}
            onRequest={handleRequestSession}
          />
        )}

        {sessionToRespond && (
          <SessionResponseModal
            isOpen={isResponseModalOpen}
            onClose={() => setIsResponseModalOpen(false)}
            session={sessionToRespond}
            onRespond={handleRespondSession}
          />
        )}

        {selectedSessionDetails && (
          <SessionDetailsModal
            isOpen={isSessionDetailsModalOpen}
            onClose={() => setIsSessionDetailsModalOpen(false)}
            session={selectedSessionDetails}
            currentUserIsMentor={user?.id === mentorId}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}
