'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2Icon, CalendarDaysIcon, MessageSquareIcon, SettingsIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { useMentorship } from '@/hooks/useMentorship'
import { MentorAvailabilitySettings } from '@/components/mentorship/MentorAvailabilitySettings'
import { SessionDetailsModal } from '@/components/mentorship/SessionDetailsModal'
import { SessionResponseModal } from '@/components/mentorship/SessionResponseModal'
import { useTranslation } from 'react-i18next'
import { mentorship_session } from '@/types/database'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function MentorshipPage() {
  const { t } = useTranslation()
  const { user, isLoading: authLoading, isMentor, isMentee } = useAuth()
  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    fetchSessions,
    respondToSessionRequest,
  } = useMentorship(user?.id)

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<mentorship_session | null>(null)
  const [sessionToRespond, setSessionToRespond] = useState<mentorship_session | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchSessions()
    }
  }, [user?.id, fetchSessions])

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

  const pendingRequests = sessions.filter(s => s.status === 'pending')
  const upcomingSessions = sessions.filter(s => s.status === 'accepted' && new Date(s.scheduled_time) > new Date())
  const pastSessions = sessions.filter(s => s.status !== 'pending' && new Date(s.scheduled_time) <= new Date())

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
          {t('mentorshipPage.title')}
        </h1>

        <Tabs defaultValue={isMentor ? "requests" : "upcoming"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {isMentor && <TabsTrigger value="requests">{t('mentorshipPage.tabs.requests')}</TabsTrigger>}
            <TabsTrigger value="upcoming">{t('mentorshipPage.tabs.upcoming')}</TabsTrigger>
            <TabsTrigger value="past">{t('mentorshipPage.tabs.past')}</TabsTrigger>
            {isMentor && <TabsTrigger value="settings">{t('mentorshipPage.tabs.settings')}</TabsTrigger>}
          </TabsList>

          {isMentor && (
            <TabsContent value="requests" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('mentorshipPage.requestsTab.title')}</CardTitle>
                  <CardDescription>{t('mentorshipPage.requestsTab.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sessionsLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader2Icon className="h-6 w-6 animate-spin" />
                      <span className="ml-2">{t('common.loading')}</span>
                    </div>
                  ) : sessionsError ? (
                    <p className="text-red-500">{t('mentorshipPage.requestsTab.errorLoading')}</p>
                  ) : pendingRequests.length === 0 ? (
                    <p className="text-muted-foreground">{t('mentorshipPage.requestsTab.noRequests')}</p>
                  ) : (
                    pendingRequests.map(session => (
                      <div key={session.id} className="border rounded-md p-4 shadow-sm">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(session.scheduled_time), t('mentorshipPage.dateFormat'))}
                        </p>
                        <h3 className="font-semibold text-lg">
                          {session.topic}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t('mentorshipPage.requestsTab.fromMentee', { name: session.mentee_profile?.full_name || 'N/A' })}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" onClick={() => handleOpenDetailsModal(session)}>
                            {t('mentorshipPage.detailsButton')}
                          </Button>
                          <Button size="sm" onClick={() => handleOpenResponseModal(session)}>
                            {t('mentorshipPage.respondButton')}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="upcoming" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('mentorshipPage.upcomingTab.title')}</CardTitle>
                <CardDescription>{t('mentorshipPage.upcomingTab.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sessionsLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2Icon className="h-6 w-6 animate-spin" />
                    <span className="ml-2">{t('common.loading')}</span>
                  </div>
                ) : sessionsError ? (
                  <p className="text-red-500">{t('mentorshipPage.upcomingTab.errorLoading')}</p>
                ) : upcomingSessions.length === 0 ? (
                  <p className="text-muted-foreground">{t('mentorshipPage.upcomingTab.noUpcoming')}</p>
                ) : (
                  upcomingSessions.map(session => (
                    <div key={session.id} className="border rounded-md p-4 shadow-sm">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.scheduled_time), t('mentorshipPage.dateFormat'))}
                      </p>
                      <h3 className="font-semibold text-lg">
                        {session.topic}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isMentee ? t('mentorshipPage.upcomingTab.withMentor', { name: session.mentor_profile?.full_name || 'N/A' }) : t('mentorshipPage.upcomingTab.withMentee', { name: session.mentee_profile?.full_name || 'N/A' })}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDetailsModal(session)}>
                          {t('mentorshipPage.detailsButton')}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('mentorshipPage.pastTab.title')}</CardTitle>
                <CardDescription>{t('mentorshipPage.pastTab.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sessionsLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2Icon className="h-6 w-6 animate-spin" />
                    <span className="ml-2">{t('common.loading')}</span>
                  </div>
                ) : sessionsError ? (
                  <p className="text-red-500">{t('mentorshipPage.pastTab.errorLoading')}</p>
                ) : pastSessions.length === 0 ? (
                  <p className="text-muted-foreground">{t('mentorshipPage.pastTab.noPast')}</p>
                ) : (
                  pastSessions.map(session => (
                    <div key={session.id} className="border rounded-md p-4 shadow-sm">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.scheduled_time), t('mentorshipPage.dateFormat'))}
                      </p>
                      <h3 className="font-semibold text-lg">
                        {session.topic}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isMentee ? t('mentorshipPage.pastTab.withMentor', { name: session.mentor_profile?.full_name || 'N/A' }) : t('mentorshipPage.pastTab.withMentee', { name: session.mentee_profile?.full_name || 'N/A' })}
                      </p>
                      <p className={cn(
                        "text-sm font-medium mt-1",
                        session.status === 'accepted' && 'text-green-600',
                        session.status === 'rejected' && 'text-red-600',
                        session.status === 'completed' && 'text-blue-600'
                      )}>
                        {t(`sessionStatus.${session.status}`)}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDetailsModal(session)}>
                          {t('mentorshipPage.detailsButton')}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isMentor && (
            <TabsContent value="settings" className="mt-6">
              <MentorAvailabilitySettings mentorId={user?.id || ''} />
            </TabsContent>
          )}
        </Tabs>
      </div>

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
