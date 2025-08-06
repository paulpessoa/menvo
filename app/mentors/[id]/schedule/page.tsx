'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, isSameDay, addDays, isBefore, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { Loader2Icon, CalendarDaysIcon, ClockIcon, CheckCircleIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useMentors } from '@/hooks/useMentors'
import { useMentorship } from '@/hooks/useMentorship'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { toast } from '@/components/ui/use-toast'
import { useTranslation } from 'react-i18next'

export default function ScheduleMentorSessionPage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const mentorId = params.id as string

  const { user, isLoading: authLoading, isMentee } = useAuth()
  const { mentor, loading: mentorLoading, error: mentorError } = useMentors(mentorId)
  const { requestMentorshipSession, loading: requestLoading } = useMentorship(user?.id)

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined)
  const [topic, setTopic] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      toast({
        title: t('scheduleSession.loginRequiredTitle'),
        description: t('scheduleSession.loginRequiredDescription'),
        variant: 'destructive',
      })
    } else if (!authLoading && user && !isMentee) {
      router.push('/unauthorized')
      toast({
        title: t('scheduleSession.menteeOnlyTitle'),
        description: t('scheduleSession.menteeOnlyDescription'),
        variant: 'destructive',
      })
    }
  }, [authLoading, user, isMentee, router, toast, t])

  if (authLoading || mentorLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2Icon className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('common.loading')}</span>
      </div>
    )
  }

  if (mentorError || !mentor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-3xl font-bold mb-4">{t('scheduleSession.mentorNotFoundTitle')}</h1>
        <p className="text-lg mb-6">{t('scheduleSession.mentorNotFoundDescription')}</p>
        <Button onClick={() => router.push('/mentors')}>{t('scheduleSession.backToMentors')}</Button>
      </div>
    )
  }

  const availableTimes = [
    '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ] // Mock available times

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedTime(undefined) // Reset time when date changes
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id || !mentor?.id || !selectedDate || !selectedTime || !topic) {
      toast({
        title: t('scheduleSession.validationErrorTitle'),
        description: t('scheduleSession.validationErrorDescription'),
        variant: 'destructive',
      })
      return
    }

    const scheduledDateTime = new Date(selectedDate)
    const [hours, minutes] = selectedTime.split(':').map(Number)
    scheduledDateTime.setHours(hours, minutes, 0, 0)

    if (isBefore(scheduledDateTime, new Date())) {
      toast({
        title: t('scheduleSession.pastTimeErrorTitle'),
        description: t('scheduleSession.pastTimeErrorDescription'),
        variant: 'destructive',
      })
      return
    }

    try {
      await requestMentorshipSession(
        user.id,
        mentor.id,
        scheduledDateTime.toISOString(),
        topic,
        message
      )
      toast({
        title: t('scheduleSession.successTitle'),
        description: t('scheduleSession.successDescription'),
        variant: 'default',
      })
      router.push('/calendar') // Redirect to calendar page
    } catch (error: any) {
      toast({
        title: t('scheduleSession.errorTitle'),
        description: error.message || t('scheduleSession.errorDescription'),
        variant: 'destructive',
      })
    }
  }

  return (
    <ProtectedRoute requiredRoles={['mentee']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">
          {t('scheduleSession.title', { mentorName: mentor.user_profiles?.full_name || t('common.mentor') })}
        </h1>

        <Card className="max-w-3xl mx-auto p-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{t('scheduleSession.cardTitle')}</CardTitle>
            <CardDescription>{t('scheduleSession.cardDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-6">
              {/* Date Selection */}
              <div className="grid gap-2">
                <Label htmlFor="date">{t('scheduleSession.dateLabel')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarDaysIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, t('scheduleSession.dateFormat')) : <span>{t('scheduleSession.pickDate')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                      disabled={(date) => isBefore(date, startOfDay(new Date()))}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Selection */}
              <div className="grid gap-2">
                <Label htmlFor="time">{t('scheduleSession.timeLabel')}</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedDate}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('scheduleSession.selectTime')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimes.map(time => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Topic */}
              <div className="grid gap-2">
                <Label htmlFor="topic">{t('scheduleSession.topicLabel')}</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t('scheduleSession.topicPlaceholder')}
                  required
                />
              </div>

              {/* Message */}
              <div className="grid gap-2">
                <Label htmlFor="message">{t('scheduleSession.messageLabel')}</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('scheduleSession.messagePlaceholder')}
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={requestLoading}>
                {requestLoading ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    {t('scheduleSession.loadingButton')}
                  </>
                ) : (
                  t('scheduleSession.submitButton')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
