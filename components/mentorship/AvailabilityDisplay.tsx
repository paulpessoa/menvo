"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTranslations, useLocale } from "next-intl"
import {
    Clock,
    Calendar,
    MapPin,
    CheckCircle,
    XCircle,
    AlertCircle
} from "lucide-react"

interface AvailabilitySlot {
    id?: string
    day_of_week: number
    start_time: string
    end_time: string
    timezone: string
    is_booked?: boolean
}

interface AvailabilityDisplayProps {
    mentorId: string
    availability: AvailabilitySlot[]
    timezone?: string
    showBookingButtons?: boolean
    onBookSlot?: (slot: AvailabilitySlot) => void
    compact?: boolean
}

export default function AvailabilityDisplay({
    mentorId,
    availability,
    timezone = 'America/Sao_Paulo',
    showBookingButtons = false,
    onBookSlot,
    compact = false
}: AvailabilityDisplayProps) {
    const t = useTranslations("availability")
    const locale = useLocale()
    const [groupedAvailability, setGroupedAvailability] = useState<Record<number, AvailabilitySlot[]>>({})

    const DAYS_OF_WEEK = useMemo(() => [
        { value: 0, label: t("days.0"), short: t("daysShort.0") },
        { value: 1, label: t("days.1"), short: t("daysShort.1") },
        { value: 2, label: t("days.2"), short: t("daysShort.2") },
        { value: 3, label: t("days.3"), short: t("daysShort.3") },
        { value: 4, label: t("days.4"), short: t("daysShort.4") },
        { value: 5, label: t("days.5"), short: t("daysShort.5") },
        { value: 6, label: t("days.6"), short: t("daysShort.6") }
    ], [t])

    useEffect(() => {
        // Group availability by day of week
        const grouped = availability.reduce((acc, slot) => {
            if (!acc[slot.day_of_week]) {
                acc[slot.day_of_week] = []
            }
            acc[slot.day_of_week].push(slot)
            return acc
        }, {} as Record<number, AvailabilitySlot[]>)

        // Sort slots within each day by start time
        Object.keys(grouped).forEach(day => {
            grouped[parseInt(day)].sort((a, b) => a.start_time.localeCompare(b.start_time))
        })

        setGroupedAvailability(grouped)
    }, [availability])

    const formatTime = (time: string) => {
        // Handle HH:mm:ss or HH:mm format
        const timeString = time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getAvailabilityStatus = (slot: AvailabilitySlot) => {
        if (slot.is_booked) {
            return {
                icon: XCircle,
                color: 'text-red-600',
                bgColor: 'bg-red-100',
                label: t("display.status.busy")
            }
        }

        // Check if slot is in the past (simplified)
        const now = new Date()
        const today = now.getDay()
        const currentTime = now.toTimeString().slice(0, 8)

        if (slot.day_of_week === today && slot.end_time < currentTime) {
            return {
                icon: AlertCircle,
                color: 'text-gray-600',
                bgColor: 'bg-gray-100',
                label: t("display.status.past")
            }
        }

        return {
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            label: t("display.status.available")
        }
    }

    const renderCompactView = () => {
        const availableDays = Object.keys(groupedAvailability).map(Number).sort()

        if (availableDays.length === 0) {
            return (
                <div className="text-center py-4 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t("display.noAvailability")}</p>
                </div>
            )
        }

        return (
            <div className="space-y-2">
                {availableDays.map(dayOfWeek => {
                    const dayData = DAYS_OF_WEEK.find(d => d.value === dayOfWeek)
                    const slots = groupedAvailability[dayOfWeek]

                    return (
                        <div key={dayOfWeek} className="flex justify-between items-center py-2 border-b last:border-b-0">
                            <span className="font-medium text-sm">
                                {compact ? dayData?.short : dayData?.label}
                            </span>
                            <div className="flex flex-wrap gap-1 justify-end">
                                {slots.map((slot, index) => {
                                    const status = getAvailabilityStatus(slot)
                                    return (
                                        <Badge
                                            key={index}
                                            variant="outline"
                                            className={`text-[10px] px-1.5 py-0 ${status.bgColor} ${status.color} border-current font-normal`}
                                        >
                                            {formatTime(slot.start_time)}
                                        </Badge>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}

                {timezone && (
                    <div className="flex items-center justify-center pt-2 text-[10px] text-gray-400">
                        <MapPin className="h-2.5 w-2.5 mr-1" />
                        {t("display.timezone", { timezone })}
                    </div>
                )}
            </div>
        )
    }

    const renderDetailedView = () => {
        const availableDays = Object.keys(groupedAvailability).map(Number).sort()

        if (availableDays.length === 0) {
            return (
                <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t("display.noAvailability")}</p>
                    <p className="text-sm mt-2">{t("display.noAvailabilityDesc")}</p>
                </div>
            )
        }

        return (
            <div className="space-y-4">
                {availableDays.map(dayOfWeek => {
                    const dayData = DAYS_OF_WEEK.find(d => d.value === dayOfWeek)
                    const slots = groupedAvailability[dayOfWeek]

                    return (
                        <div key={dayOfWeek} className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-3 flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                {dayData?.label}
                            </h4>

                            <div className="grid gap-2">
                                {slots.map((slot, index) => {
                                    const status = getAvailabilityStatus(slot)
                                    const StatusIcon = status.icon

                                    return (
                                        <div
                                            key={index}
                                            className={`flex items-center justify-between p-3 rounded-lg border ${status.bgColor}`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <StatusIcon className={`h-4 w-4 ${status.color}`} />
                                                <div>
                                                    <div className="font-medium">
                                                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                                    </div>
                                                    <div className={`text-sm ${status.color}`}>
                                                        {status.label}
                                                    </div>
                                                </div>
                                            </div>

                                            {showBookingButtons && !slot.is_booked && onBookSlot && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => onBookSlot(slot)}
                                                    disabled={status.label === t("display.status.past")}
                                                >
                                                    {t("display.book")}
                                                </Button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}

                {timezone && (
                    <div className="flex items-center justify-center pt-4 text-sm text-gray-500 border-t">
                        <MapPin className="h-4 w-4 mr-2" />
                        {t("display.timezone", { timezone })}
                    </div>
                )}
            </div>
        )
    }

    if (compact) {
        return renderCompactView()
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-lg">
                    <Clock className="h-5 w-5 mr-2" />
                    {t("display.cardTitle")}
                </CardTitle>
                <CardDescription>
                    {t("display.cardDescription")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {renderDetailedView()}
            </CardContent>
        </Card>
    )
}
