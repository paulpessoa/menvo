"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Loader2, Info } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"
import { useMentorship } from "@/hooks/useMentorship"
import { MentorAvailability as MentorAvailabilityType } from "@/types/database"
import { useTranslation } from "react-i18next"

interface MentorAvailabilitySettingsProps {
  mentorId: string
}

export function MentorAvailabilitySettings({ mentorId }: MentorAvailabilitySettingsProps) {
  const { t } = useTranslation()
  const {
    mentorAvailability,
    isLoadingAvailability,
    errorAvailability,
    updateMentorAvailability,
  } = useMentorship(mentorId)

  const [currentAvailability, setCurrentAvailability] = useState<MentorAvailabilityType[]>([])
  const [newSlot, setNewSlot] = useState<Omit<MentorAvailabilityType, 'id' | 'mentor_id' | 'created_at'>>({
    day_of_week: "monday",
    start_time: "09:00:00",
    end_time: "17:00:00",
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (mentorAvailability) {
      setCurrentAvailability(mentorAvailability)
    }
  }, [mentorAvailability])

  const daysOfWeek = [
    { value: "sunday", label: t('daysOfWeek.sunday') },
    { value: "monday", label: t('daysOfWeek.monday') },
    { value: "tuesday", label: t('daysOfWeek.tuesday') },
    { value: "wednesday", label: t('daysOfWeek.wednesday') },
    { value: "thursday", label: t('daysOfWeek.thursday') },
    { value: "friday", label: t('daysOfWeek.friday') },
    { value: "saturday", label: t('daysOfWeek.saturday') },
  ]

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0')
    return [`${hour}:00:00`, `${hour}:30:00`]
  }).flat()

  const addSlot = () => {
    if (!newSlot.day_of_week || !newSlot.start_time || !newSlot.end_time) {
      toast({
        title: t('mentorAvailability.addSlot.requiredFieldsTitle'),
        description: t('mentorAvailability.addSlot.requiredFieldsDescription'),
        variant: "destructive",
      })
      return
    }
    if (newSlot.start_time >= newSlot.end_time) {
      toast({
        title: t('mentorAvailability.addSlot.invalidTimeTitle'),
        description: t('mentorAvailability.addSlot.invalidTimeDescription'),
        variant: "destructive",
      })
      return
    }

    setCurrentAvailability((prev) => [
      ...prev,
      {
        ...newSlot,
        id: `new-${Date.now()}`, // Temporary ID for new slots
        mentor_id: mentorId,
        created_at: new Date().toISOString(),
      },
    ])
    setNewSlot({ day_of_week: "monday", start_time: "09:00:00", end_time: "17:00:00" })
    toast({
      title: t('mentorAvailability.addSlot.successTitle'),
      description: t('mentorAvailability.addSlot.successDescription'),
      variant: "default",
    })
  }

  const removeSlot = (id: string) => {
    setCurrentAvailability((prev) => prev.filter((slot) => slot.id !== id))
    toast({
      title: t('mentorAvailability.removeSlot.successTitle'),
      description: t('mentorAvailability.removeSlot.successDescription'),
      variant: "default",
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await updateMentorAvailability(mentorId, currentAvailability)
      if (error) throw error
      toast({
        title: t('mentorAvailability.save.successTitle'),
        description: t('mentorAvailability.save.successDescription'),
        variant: "default",
      })
    } catch (error: any) {
      toast({
        title: t('mentorAvailability.save.errorTitle'),
        description: error.message || t('mentorAvailability.save.errorMessage'),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingAvailability) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('mentorAvailability.title')}</CardTitle>
          <CardDescription>{t('mentorAvailability.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">{t('mentorAvailability.loading')}</p>
        </CardContent>
      </Card>
    )
  }

  if (errorAvailability) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('mentorAvailability.title')}</CardTitle>
          <CardDescription>{t('mentorAvailability.description')}</CardDescription>
        </CardHeader>
        <CardContent className="text-red-500 text-center py-8">
          <p>{t('mentorAvailability.errorLoading')}: {errorAvailability.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('mentorAvailability.title')}</CardTitle>
        <CardDescription>{t('mentorAvailability.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentAvailability.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">{t('mentorAvailability.noSlotsAdded')}</p>
        ) : (
          <div className="space-y-4">
            {currentAvailability.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between border rounded-md p-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {daysOfWeek.find(d => d.value === slot.day_of_week)?.label}
                  </span>
                  <span>{slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeSlot(slot.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                  <span className="sr-only">{t('mentorAvailability.removeSlot.srOnly')}</span>
                </Button>
              </div>
            ))}
          </div>
        )}

        <Separator />

        <h3 className="text-lg font-semibold">{t('mentorAvailability.addNewSlot.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="day">{t('mentorAvailability.addNewSlot.dayLabel')}</Label>
            <Select value={newSlot.day_of_week} onValueChange={(value) => setNewSlot({ ...newSlot, day_of_week: value as any })}>
              <SelectTrigger id="day">
                <SelectValue placeholder={t('mentorAvailability.addNewSlot.dayPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="start-time">{t('mentorAvailability.addNewSlot.startLabel')}</Label>
            <Select value={newSlot.start_time} onValueChange={(value) => setNewSlot({ ...newSlot, start_time: value })}>
              <SelectTrigger id="start-time">
                <SelectValue placeholder={t('mentorAvailability.addNewSlot.startPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time.substring(0, 5)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time">{t('mentorAvailability.addNewSlot.endLabel')}</Label>
            <Select value={newSlot.end_time} onValueChange={(value) => setNewSlot({ ...newSlot, end_time: value })}>
              <SelectTrigger id="end-time">
                <SelectValue placeholder={t('mentorAvailability.addNewSlot.endPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time.substring(0, 5)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addSlot} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" /> {t('mentorAvailability.addNewSlot.addButton')}
          </Button>
        </div>

        <div className="flex items-start gap-2 text-blue-600 text-sm bg-blue-50 p-3 rounded-lg">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>{t('mentorAvailability.infoMessage')}</p>
        </div>

        <Button onClick={handleSave} className="w-full mt-6" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('mentorAvailability.save.savingButton')}
            </>
          ) : (
            t('mentorAvailability.save.button')
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
