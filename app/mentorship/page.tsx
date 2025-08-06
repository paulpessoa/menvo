'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMentorship } from '@/hooks/useMentorship'
import { useUserProfile } from '@/hooks/useUserProfile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Loader2, CalendarCheckIcon, ClockIcon, UserIcon, MessageSquareIcon, SettingsIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { SessionDetailsModal } from '@/components/mentorship/SessionDetailsModal'
import { SessionResponseModal } from '@/components/mentorship/SessionResponseModal'
import { MentorAvailabilitySettings } from '@/components/mentorship/MentorAvailabilitySettings'
import Link from 'next/link'

export default function MentorshipPage() {
  const { user, isLoading: authLoading, isMentor, isMentee } = useAuth()
  const { userProfile, loading: profileLoading } = useUserProfile(user?.id)
  const {
    mentorSessions,
    menteeSessions,
    isLoading: mentorshipLoading,
    error: mentorshipError,
    respondToMentorshipSession,
  } = useMentorship(user?.id, user?.id) // Pass user.id for both mentor and mentee sessions

  const [isSessionDetailsModalOpen, setIsSessionDetailsModalOpen] = useState(false)
  const [selectedSessionDetails, setSelectedSessionDetails] = useState<any>(null) // Type this properly
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false)
  const [sessionToRespond, setSessionToRespond] = useState<any>(null) // Type this properly

  const isLoading = authLoading || profileLoading || mentorshipLoading

  const handleOpenSessionDetails = (session: any) => {
    setSelectedSessionDetails(session)
    setIsSessionDetailsModalOpen(true)
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

  const pendingMentorSessions = useMemo(() => {
    return mentorSessions?.filter(session => session.status === 'pending') || []
  }, [mentorSessions])

  const upcomingMentorSessions = useMemo(() => {
    const now = new Date()
    return mentorSessions?.filter(session =>
      session.status === 'accepted' && parseISO(session.scheduled_time) > now
    ).sort((a, b) => parseISO(a.scheduled_time).getTime() - parseISO(b.scheduled_time).getTime()) || []
  }, [mentorSessions])

  const pastMentorSessions = useMemo(() => {
    const now = new Date()
    return mentorSessions?.filter(session =>
      session.status === 'accepted' && parseISO(session.scheduled_time) <= now
    ).sort((a, b) => parseISO(b.scheduled_time).getTime() - parseISO(a.scheduled_time).getTime()) || []
  }, [mentorSessions])

  const pendingMenteeSessions = useMemo(() => {
    return menteeSessions?.filter(session => session.status === 'pending') || []
  }, [menteeSessions])

  const upcomingMenteeSessions = useMemo(() => {
    const now = new Date()
    return menteeSessions?.filter(session =>
      session.status === 'accepted' && parseISO(session.scheduled_time) > now
    ).sort((a, b) => parseISO(a.scheduled_time).getTime() - parseISO(b.scheduled_time).getTime()) || []
  }, [menteeSessions])

  const pastMenteeSessions = useMemo(() => {
    const now = new Date()
    return menteeSessions?.filter(session =>
      session.status === 'accepted' && parseISO(session.scheduled_time) <= now
    ).sort((a, b) => parseISO(b.scheduled_time).getTime() - parseISO(a.scheduled_time).getTime()) || []
  }, [menteeSessions])


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando suas mentorias...</span>
      </div>
    )
  }

  if (mentorshipError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-3xl font-bold mb-4">Erro ao carregar mentorias</h1>
        <p className="text-lg mb-6">{mentorshipError?.message || 'Ocorreu um erro inesperado.'}</p>
        <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">Minhas Mentorias</h1>

        <Tabs defaultValue={isMentor ? "mentor-upcoming" : "mentee-upcoming"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {isMentor && (
              <>
                <TabsTrigger value="mentor-pending">Pendentes (Mentor)</TabsTrigger>
                <TabsTrigger value="mentor-upcoming">Próximas (Mentor)</TabsTrigger>
                <TabsTrigger value="mentor-past">Passadas (Mentor)</TabsTrigger>
              </>
            )}
            {isMentee && (
              <>
                <TabsTrigger value="mentee-pending">Pendentes (Mentee)</TabsTrigger>
                <TabsTrigger value="mentee-upcoming">Próximas (Mentee)</TabsTrigger>
                <TabsTrigger value="mentee-past">Passadas (Mentee)</TabsTrigger>
              </>
            )}
          </TabsList>

          {isMentor && (
            <>
              <TabsContent value="mentor-pending" className="mt-6">
                <h2 className="text-2xl font-bold mb-4">Solicitações de Mentoria Pendentes</h2>
                {pendingMentorSessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingMentorSessions.map((session) => (
                      <Card key={session.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            Sessão com {session.mentee_profile?.full_name || session.mentee_profile?.email}
                          </CardTitle>
                          <CardDescription>
                            <ClockIcon className="inline-block h-4 w-4 mr-1" />
                            {format(parseISO(session.scheduled_time), 'PPP - HH:mm', { locale: ptBR })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Notas: {session.notes || 'N/A'}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              className="w-full"
                              onClick={() => { setSessionToRespond(session); setIsResponseModalOpen(true); }}
                            >
                              Responder
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhuma solicitação de mentoria pendente.</p>
                )}
              </TabsContent>

              <TabsContent value="mentor-upcoming" className="mt-6">
                <h2 className="text-2xl font-bold mb-4">Próximas Mentorias Agendadas</h2>
                {upcomingMentorSessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingMentorSessions.map((session) => (
                      <Card key={session.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            Sessão com {session.mentee_profile?.full_name || session.mentee_profile?.email}
                          </CardTitle>
                          <CardDescription>
                            <ClockIcon className="inline-block h-4 w-4 mr-1" />
                            {format(parseISO(session.scheduled_time), 'PPP - HH:mm', { locale: ptBR })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Notas: {session.notes || 'N/A'}
                          </p>
                          <Button onClick={() => handleOpenSessionDetails(session)} variant="outline" className="w-full">
                            Ver Detalhes
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhuma mentoria futura agendada.</p>
                )}
              </TabsContent>

              <TabsContent value="mentor-past" className="mt-6">
                <h2 className="text-2xl font-bold mb-4">Mentorias Passadas</h2>
                {pastMentorSessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pastMentorSessions.map((session) => (
                      <Card key={session.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            Sessão com {session.mentee_profile?.full_name || session.mentee_profile?.email}
                          </CardTitle>
                          <CardDescription>
                            <ClockIcon className="inline-block h-4 w-4 mr-1" />
                            {format(parseISO(session.scheduled_time), 'PPP - HH:mm', { locale: ptBR })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Notas: {session.notes || 'N/A'}
                          </p>
                          <Button onClick={() => handleOpenSessionDetails(session)} variant="outline" className="w-full">
                            Ver Detalhes
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhuma mentoria passada.</p>
                )}
              </TabsContent>

              <Separator className="my-8" />

              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5" />
                    Configurações de Disponibilidade
                  </CardTitle>
                  <CardDescription>
                    Gerencie seus horários disponíveis para sessões de mentoria.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MentorAvailabilitySettings userId={user?.id || ''} />
                </CardContent>
              </Card>
            </>
          )}

          {isMentee && (
            <>
              <TabsContent value="mentee-pending" className="mt-6">
                <h2 className="text-2xl font-bold mb-4">Suas Solicitações de Mentoria Pendentes</h2>
                {pendingMenteeSessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingMenteeSessions.map((session) => (
                      <Card key={session.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            Sessão com {session.mentor_profile?.full_name || session.mentor_profile?.email}
                          </CardTitle>
                          <CardDescription>
                            <ClockIcon className="inline-block h-4 w-4 mr-1" />
                            {format(parseISO(session.scheduled_time), 'PPP - HH:mm', { locale: ptBR })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Notas: {session.notes || 'N/A'}
                          </p>
                          <Button onClick={() => handleOpenSessionDetails(session)} variant="outline" className="w-full">
                            Ver Detalhes
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhuma solicitação de mentoria pendente.</p>
                )}
              </TabsContent>

              <TabsContent value="mentee-upcoming" className="mt-6">
                <h2 className="text-2xl font-bold mb-4">Suas Próximas Mentorias Agendadas</h2>
                {upcomingMenteeSessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingMenteeSessions.map((session) => (
                      <Card key={session.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            Sessão com {session.mentor_profile?.full_name || session.mentor_profile?.email}
                          </CardTitle>
                          <CardDescription>
                            <ClockIcon className="inline-block h-4 w-4 mr-1" />
                            {format(parseISO(session.scheduled_time), 'PPP - HH:mm', { locale: ptBR })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Notas: {session.notes || 'N/A'}
                          </p>
                          <Button onClick={() => handleOpenSessionDetails(session)} variant="outline" className="w-full">
                            Ver Detalhes
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhuma mentoria futura agendada.</p>
                )}
              </TabsContent>

              <TabsContent value="mentee-past" className="mt-6">
                <h2 className="text-2xl font-bold mb-4">Suas Mentorias Passadas</h2>
                {pastMenteeSessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pastMenteeSessions.map((session) => (
                      <Card key={session.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            Sessão com {session.mentor_profile?.full_name || session.mentor_profile?.email}
                          </CardTitle>
                          <CardDescription>
                            <ClockIcon className="inline-block h-4 w-4 mr-1" />
                            {format(parseISO(session.scheduled_time), 'PPP - HH:mm', { locale: ptBR })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Notas: {session.notes || 'N/A'}
                          </p>
                          <Button onClick={() => handleOpenSessionDetails(session)} variant="outline" className="w-full">
                            Ver Detalhes
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhuma mentoria passada.</p>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Modals */}
        {selectedSessionDetails && (
          <SessionDetailsModal
            isOpen={isSessionDetailsModalOpen}
            onClose={() => setIsSessionDetailsModalOpen(false)}
            session={selectedSessionDetails}
            currentUserIsMentor={user?.id === selectedSessionDetails.mentor_id}
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
      </div>
    </ProtectedRoute>
  )
}
