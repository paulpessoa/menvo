"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/utils/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Clock,
    Plus,
    Trash2,
    Save,
    Calendar,
    CheckCircle,
    AlertTriangle,
    Loader2
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useTranslations } from "next-intl"

interface AvailabilitySlot {
    id?: string
    day_of_week: number
    start_time: string
    end_time: string
    timezone: string
}

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0')
    return [
        { value: `${hour}:00:00`, label: `${hour}:00` },
        { value: `${hour}:30:00`, label: `${hour}:30` }
    ]
}).flat()

export default function MentorAvailabilityPage() {
    const t = useTranslations("availability")
    const commonT = useTranslations("common")
    const router = useRouter()
    const { user, profile, role, loading: authLoading } = useAuth()
    const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const supabase = createClient()

    const DAYS_OF_WEEK = [
        { value: 0, label: t("days.0") },
        { value: 1, label: t("days.1") },
        { value: 2, label: t("days.2") },
        { value: 3, label: t("days.3") },
        { value: 4, label: t("days.4") },
        { value: 5, label: t("days.5") },
        { value: 6, label: t("days.6") }
    ]

    useEffect(() => {
        if (authLoading) return

        if (!user) {
            router.push('/login')
            return
        }

        if (role !== 'mentor') {
            router.push('/dashboard')
            return
        }

        fetchAvailability()
    }, [user, role, authLoading, router])

    const fetchAvailability = async () => {
        if (!user?.id) return
        
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('mentor_availability')
                .select('*')
                .eq('mentor_id', user.id)
                .order('day_of_week')
                .order('start_time')

            if (error) throw error

            setAvailability(data || [])
        } catch (error) {
            console.error('Error fetching availability:', error)
            setMessage({ type: 'error', text: t("errorLoad") })
        } finally {
            setLoading(false)
        }
    }

    const addAvailabilitySlot = () => {
        const newSlot: AvailabilitySlot = {
            day_of_week: 1, // Monday by default
            start_time: '09:00:00',
            end_time: '17:00:00',
            timezone: profile?.timezone || 'America/Sao_Paulo'
        }
        setAvailability([...availability, newSlot])
    }

    const updateSlot = (index: number, field: keyof AvailabilitySlot, value: string | number) => {
        const updated = [...availability]
        updated[index] = { ...updated[index], [field]: value }
        setAvailability(updated)
    }

    const removeSlot = (index: number) => {
        const updated = availability.filter((_, i) => i !== index)
        setAvailability(updated)
    }

    const validateSlots = (): string | null => {
        for (let i = 0; i < availability.length; i++) {
            const slot = availability[i]

            // Check if start time is before end time
            if (slot.start_time >= slot.end_time) {
                const dayLabel = DAYS_OF_WEEK.find(d => d.value === slot.day_of_week)?.label || ""
                return t("invalidTime", { day: dayLabel })
            }

            // Check for overlapping slots on the same day
            for (let j = i + 1; j < availability.length; j++) {
                const otherSlot = availability[j]
                if (slot.day_of_week === otherSlot.day_of_week) {
                    const slotStart = new Date(`2000-01-01T${slot.start_time}`)
                    const slotEnd = new Date(`2000-01-01T${slot.end_time}`)
                    const otherStart = new Date(`2000-01-01T${otherSlot.start_time}`)
                    const otherEnd = new Date(`2000-01-01T${otherSlot.end_time}`)

                    if ((slotStart < otherEnd && slotEnd > otherStart)) {
                        const dayLabel = DAYS_OF_WEEK.find(d => d.value === slot.day_of_week)?.label || ""
                        return t("overlappingTime", { day: dayLabel })
                    }
                }
            }
        }
        return null
    }

    const saveAvailability = async () => {
        const validationError = validateSlots()
        if (validationError) {
            setMessage({ type: 'error', text: validationError })
            return
        }

        setSaving(true)
        setMessage(null)

        try {
            // Delete existing availability
            const { error: deleteError } = await (supabase
                .from('mentor_availability')
                .delete()
                .eq('mentor_id', user?.id || "") as any)

            if (deleteError) throw deleteError

            // Insert new availability
            if (availability.length > 0) {
                const slotsToInsert = availability.map(slot => ({
                    mentor_id: user?.id || "",
                    day_of_week: slot.day_of_week,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    timezone: slot.timezone,
                    is_active: true
                }))

                const { error: insertError } = await (supabase
                    .from('mentor_availability')
                    .insert(slotsToInsert as any) as any)

                if (insertError) throw insertError
            }

            setMessage({ type: 'success', text: t("success") })

            // Refresh data
            await fetchAvailability()
        } catch (error) {
            console.error('Error saving availability:', error)
            setMessage({ type: 'error', text: t("errorSave") })
        } finally {
            setSaving(false)
        }
    }

    const formatTime = (time: string) => {
        // Use a consistent locale for internal time formatting if needed, 
        // but here we just want the HH:mm
        const parts = time.split(':')
        return `${parts[0]}:${parts[1]}`
    }

    const getAvailabilityPreview = () => {
        const grouped = availability.reduce((acc, slot) => {
            const day = DAYS_OF_WEEK.find(d => d.value === slot.day_of_week)?.label || '?'
            if (!acc[day]) acc[day] = []
            acc[day].push(`${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`)
            return acc
        }, {} as Record<string, string[]>)

        return Object.entries(grouped).map(([day, times]) => (
            <div key={day} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <span className="font-medium">{day}</span>
                <span className="text-sm text-gray-600">{times.join(', ')}</span>
            </div>
        ))
    }

    if (loading || authLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-gray-600">{t("loading")}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {t("title")}
                </h1>
                <p className="text-gray-600">
                    {t("description")}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Clock className="h-5 w-5 mr-2" />
                                {t("availableHours")}
                            </CardTitle>
                            <CardDescription>
                                {t("availableHoursDesc")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {availability.map((slot, index) => (
                                <div key={index} className="p-4 border rounded-lg space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">{t("timeSlot", { number: index + 1 })}</h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeSlot(index)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label>{t("dayOfWeek")}</Label>
                                            <Select
                                                value={slot.day_of_week.toString()}
                                                onValueChange={(value) => updateSlot(index, 'day_of_week', parseInt(value))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {DAYS_OF_WEEK.map(day => (
                                                        <SelectItem key={day.value} value={day.value.toString()}>
                                                            {day.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>{t("startTime")}</Label>
                                            <Select
                                                value={slot.start_time}
                                                onValueChange={(value) => updateSlot(index, 'start_time', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TIME_OPTIONS.map(time => (
                                                        <SelectItem key={time.value} value={time.value}>
                                                            {time.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>{t("endTime")}</Label>
                                            <Select
                                                value={slot.end_time}
                                                onValueChange={(value) => updateSlot(index, 'end_time', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TIME_OPTIONS.map(time => (
                                                        <SelectItem key={time.value} value={time.value}>
                                                            {time.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <Button
                                variant="outline"
                                onClick={addAvailabilitySlot}
                                className="w-full"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                {t("addTime")}
                            </Button>
                        </CardContent>
                    </Card>

                    {message && (
                        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                            {message.type === 'success' ? (
                                <CheckCircle className="h-4 w-4" />
                            ) : (
                                <AlertTriangle className="h-4 w-4" />
                            )}
                            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                                {message.text}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex gap-4">
                        <Button
                            onClick={saveAvailability}
                            disabled={saving || availability.length === 0}
                            className="flex-1"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t("saving")}
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {t("saveButton")}
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Preview */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Calendar className="h-5 w-5 mr-2" />
                                {t("previewTitle")}
                            </CardTitle>
                            <CardDescription>
                                {t("previewDesc")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {availability.length > 0 ? (
                                <div className="space-y-2">
                                    {getAvailabilityPreview()}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>{t("noSchedule")}</p>
                                    <p className="text-sm">{t("addScheduleToPreview")}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("tips.title")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-gray-600">
                            <div className="flex items-start space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <p>{t("tips.tip1")}</p>
                            </div>
                            <div className="flex items-start space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <p>{t("tips.tip2")}</p>
                            </div>
                            <div className="flex items-start space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <p>{t("tips.tip3")}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}