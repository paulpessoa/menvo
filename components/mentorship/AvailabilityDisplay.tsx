"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

const DAYS_OF_WEEK = [
    { value: 0, label: 'Domingo', short: 'Dom' },
    { value: 1, label: 'Segunda-feira', short: 'Seg' },
    { value: 2, label: 'Terça-feira', short: 'Ter' },
    { value: 3, label: 'Quarta-feira', short: 'Qua' },
    { value: 4, label: 'Quinta-feira', short: 'Qui' },
    { value: 5, label: 'Sexta-feira', short: 'Sex' },
    { value: 6, label: 'Sábado', short: 'Sáb' }
]

export default function AvailabilityDisplay({
    mentorId,
    availability,
    timezone = 'America/Sao_Paulo',
    showBookingButtons = false,
    onBookSlot,
    compact = false
}: AvailabilityDisplayProps) {
    const [groupedAvailability, setGroupedAvailability] = useState<Record<number, AvailabilitySlot[]>>({})

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
        return new Date(`2000-01-01T${time}`).toLocaleTimeString('pt-BR', {
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
                label: 'Ocupado'
            }
        }

        // Check if slot is in the past (simplified - you might want more sophisticated logic)
        const now = new Date()
        const today = now.getDay()
        const currentTime = now.toTimeString().slice(0, 8)

        if (slot.day_of_week === today && slot.end_time < currentTime) {
            return {
                icon: AlertCircle,
                color: 'text-gray-600',
                bgColor: 'bg-gray-100',
                label: 'Passado'
            }
        }

        return {
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            label: 'Disponível'
        }
    }

    const renderCompactView = () => {
        const availableDays = Object.keys(groupedAvailability).map(Number).sort()

        if (availableDays.length === 0) {
            return (
                <div className="text-center py-4 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma disponibilidade configurada</p>
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
                            <div className="flex flex-wrap gap-1">
                                {slots.map((slot, index) => {
                                    const status = getAvailabilityStatus(slot)
                                    return (
                                        <Badge
                                            key={index}
                                            variant="outline"
                                            className={`text-xs ${status.bgColor} ${status.color} border-current`}
                                        >
                                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                        </Badge>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}

                {timezone && (
                    <div className="flex items-center justify-center pt-2 text-xs text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        Fuso horário: {timezone}
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
                    <p>Nenhuma disponibilidade configurada</p>
                    <p className="text-sm mt-2">O mentor ainda não definiu seus horários disponíveis</p>
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
                                                    disabled={status.label === 'Passado'}
                                                >
                                                    Agendar
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
                        Todos os horários estão no fuso: {timezone}
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
                <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Disponibilidade
                </CardTitle>
                <CardDescription>
                    Horários disponíveis para agendamento de mentorias
                </CardDescription>
            </CardHeader>
            <CardContent>
                {renderDetailedView()}
            </CardContent>
        </Card>
    )
}

// Hook para buscar disponibilidade de um mentor
export function useAvailability(mentorId: string) {
    const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!mentorId) return

        const fetchAvailability = async () => {
            try {
                setLoading(true)
                setError(null)

                // This would typically be a Supabase call
                // For now, we'll simulate it
                const response = await fetch(`/api/mentors/${mentorId}/availability`)

                if (!response.ok) {
                    throw new Error('Failed to fetch availability')
                }

                const data = await response.json()
                setAvailability(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }

        fetchAvailability()
    }, [mentorId])

    return { availability, loading, error, refetch: () => fetchAvailability() }
}