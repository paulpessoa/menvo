'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, Loader2Icon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useMentorship } from '@/hooks/useMentorship'
import { ScheduleSessionModal } from '@/components/mentorship/ScheduleSessionModal'
import { SessionDetailsModal } from '@/components/mentorship/SessionDetailsModal'
import { SessionResponseModal } from '@/components/mentorship/SessionResponseModal'
import { useTranslation } from 'react-i18next'
import { mentorship_session } from '@/types/database'

export default function CalendarPage() {
  const { t } = useTranslation()
  const { user, isLoading: authLoading, isMentor, isMentee } = useAuth()
  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    fetchSessions,
    respondToSessionRequest,
  } = useMentorship(user?.id)

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<mentorship_session | null>(null)
  const [sessionToRespond, setSessionToRespond] = useState<mentorship_session | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchSessions()
    }
  }, [user?.id, fetchSessions])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
  }

  const handleOpenScheduleModal = () => {
    setIsScheduleModalOpen(true)
  }

  const handleCloseScheduleModal = () => {
    setIsScheduleModalOpen(false)
    fetchSessions() // Refresh sessions after scheduling
  }

  const handleOpenDetailsModal = (session: mentorship_session) => {
    setSelectedSession(session)
    setIsDetailsModalOpen(true)
  }

  const handleCloseDetailsModal = () => {
    setSelectedSession(null)
    setIsDetailsModalOpen(false)
    fetchSessions() // Refresh sessions after potential updates
  }

  const handleOpenResponseModal = (session: mentorship_session) => {
    setSessionToRespond(session)
    setIsResponseModalOpen(true)
  }

  const handleCloseResponseModal = () => {
    setSessionToRespond(null)
    setIsResponseModalOpen(false)
    fetchSessions() // Refresh sessions after response
  }

  const handleRespond = async (sessionId: string, status: 'accepted' | 'rejected', message?: string) => {
    await respondToSessionRequest(sessionId, status, message)
    handleCloseResponseModal()
  }

  const sessionsForSelectedDate = useMemo(() => {
    if (!selectedDate || !sessions) return []
    return sessions.filter(session =>
      format(new Date(session.scheduled_time), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
    ).sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
  }, [selectedDate, sessions])

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2Icon className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('common.loading')}</span>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">
          {t('calendarPage.title')}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('calendarPage.calendarCard.title')}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border"
                initialFocus
              />
            </CardContent>
          </Card>

          {/* Sessions for Selected Date */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {selectedDate ? format(selectedDate, t('calendarPage.sessionsCard.dateDisplayFormat')) : t('calendarPage.sessionsCard.selectDate')}
              </CardTitle>
              {isMentee && (
                <Button size="sm" onClick={handleOpenScheduleModal}>
                  <PlusIcon className="mr-2 h-4 w-4" /> {t('calendarPage.sessionsCard.scheduleButton')}
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {sessionsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2Icon className="h-6 w-6 animate-spin" />
                  <span className="ml-2">{t('common.loading')}</span>
                </div>
              ) : sessionsError ? (
                <p className="text-red-500">{t('calendarPage.sessionsCard.errorLoading')}</p>
              ) : sessionsForSelectedDate.length === 0 ? (
                <p className="text-muted-foreground">{t('calendarPage.sessionsCard.noSessions')}</p>
              ) : (
                sessionsForSelectedDate.map(session => (
                  <div key={session.id} className="border rounded-md p-4 shadow-sm">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(session.scheduled_time), t('calendarPage.sessionsCard.timeFormat'))}
                    </p>
                    <h3 className="font-semibold text-lg">
                      {session.topic}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isMentee ? t('calendarPage.sessionsCard.withMentor', { name: session.mentor_profile?.full_name || 'N/A' }) : t('calendarPage.sessionsCard.withMentee', { name: session.mentee_profile?.full_name || 'N/A' })}
                    </p>
                    <p className={cn(
                      "text-sm font-medium mt-1",
                      session.status === 'accepted' && 'text-green-600',
                      session.status === 'pending' && 'text-yellow-600',
                      session.status === 'rejected' && 'text-red-600'
                    )}>
                      {t(`sessionStatus.${session.status}`)}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDetailsModal(session)}>
                        {t('calendarPage.sessionsCard.detailsButton')}
                      </Button>
                      {isMentor && session.status === 'pending' && (
                        <Button size="sm" onClick={() => handleOpenResponseModal(session)}>
                          {t('calendarPage.sessionsCard.respondButton')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ScheduleSessionModal
        isOpen={isScheduleModalOpen}
        onClose={handleCloseScheduleModal}
        initialDate={selectedDate}
        menteeId={user?.id || ''}
      />
      <SessionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        session={selectedSession}
        currentUserId={user?.id || ''}
        isMentor={isMentor}
      />
      <SessionResponseModal
        isOpen={isResponseModalOpen}
        onClose={handleCloseResponseModal}
        session={sessionToRespond}
        onRespond={handleRespond}
      />
    </ProtectedRoute>
  )
}
