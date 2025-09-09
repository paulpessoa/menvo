"use client"

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
    Calendar,
    Clock,
    User,
    Video,
    MessageSquare,
    ExternalLink
} from 'lucide-react'
import { AppointmentStatusBadge } from './appointment-status-badge'
import { ConfirmAppointmentButton } from './confirm-appointment-button'
import { CancelAppointmentButton } from './cancel-appointment-button'

interface Appointment {
    id: string
    scheduled_at: string
    duration_minutes: number
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
    notes?: string
    google_meet_link?: string
    mentor: {
        id: string
        full_name: string
        email: string
        avatar_url?: string
    }
    mentee: {
        id: string
        full_name: string
        email: string
        avatar_url?: string
    }
}

interface AppointmentCardProps {
    appointment: Appointment
    currentUserId: string
    onAppointmentUpdate?: (appointment: Appointment) => void
}

export function AppointmentCard({
    appointment,
    currentUserId,
    onAppointmentUpdate
}: AppointmentCardProps) {
    const isMentor = appointment.mentor.id === currentUserId
    const otherPerson = isMentor ? appointment.mentee : appointment.mentor
    const userRole = isMentor ? 'mentor' : 'mentee'

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const isToday = date.toDateString() === now.toDateString()
        const isPast = date < now

        return {
            date: date.toLocaleDateString('pt-BR', {
                weekday: isToday ? undefined : 'short',
                day: 'numeric',
                month: 'short',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
            }),
            time: date.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
            }),
            isToday,
            isPast,
        }
    }

    const { date, time, isToday, isPast } = formatDateTime(appointment.scheduled_at)

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const canConfirm = isMentor && appointment.status === 'pending'
    const canCancel = appointment.status === 'pending' || appointment.status === 'confirmed'
    const canJoinMeet = appointment.status === 'confirmed' && appointment.google_meet_link && !isPast

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={otherPerson.avatar_url} />
                            <AvatarFallback>{getInitials(otherPerson.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold text-sm">
                                {otherPerson.full_name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {userRole === 'mentor' ? 'Mentee' : 'Mentor'}
                            </p>
                        </div>
                    </div>
                    <AppointmentStatusBadge status={appointment.status} />
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className={isToday ? 'font-medium text-blue-600' : ''}>
                        {isToday ? 'Hoje' : date}
                    </span>
                    {isToday && <Badge variant="outline" className="text-xs">Hoje</Badge>}
                </div>

                <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{time}</span>
                    <span className="text-muted-foreground">
                        ({appointment.duration_minutes} min)
                    </span>
                    {isPast && appointment.status !== 'completed' && (
                        <Badge variant="outline" className="text-xs text-orange-600">
                            Expirado
                        </Badge>
                    )}
                </div>

                {appointment.google_meet_link && (
                    <div className="flex items-center gap-2 text-sm">
                        <Video className="w-4 h-4 text-muted-foreground" />
                        <span className="text-green-600">Link do Meet disponível</span>
                    </div>
                )}

                {appointment.notes && (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">Observações:</span>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">
                            {appointment.notes}
                        </p>
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-3 gap-2">
                {canJoinMeet && (
                    <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        asChild
                    >
                        <a
                            href={appointment.google_meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Video className="w-4 h-4 mr-2" />
                            Entrar no Meet
                            <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                    </Button>
                )}

                {canConfirm && (
                    <ConfirmAppointmentButton
                        appointment={appointment}
                        onConfirmed={onAppointmentUpdate}
                    />
                )}

                {canCancel && (
                    <CancelAppointmentButton
                        appointment={appointment}
                        onCancelled={onAppointmentUpdate}
                        variant="outline"
                    />
                )}
            </CardFooter>
        </Card>
    )
}
