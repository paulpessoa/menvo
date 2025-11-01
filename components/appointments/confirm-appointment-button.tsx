"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Calendar, Clock, User, Video } from 'lucide-react'
import { toast } from 'sonner'

interface Appointment {
    id: string | number
    scheduled_at: string
    duration_minutes: number
    notes?: string
    mentee: {
        full_name: string
        email: string
    }
}

interface ConfirmAppointmentButtonProps {
    appointment: Appointment
    onConfirmed?: (appointment: any) => void
}

export function ConfirmAppointmentButton({
    appointment,
    onConfirmed
}: ConfirmAppointmentButtonProps) {
    const [isConfirming, setIsConfirming] = useState(false)
    const [mentorNotes, setMentorNotes] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString)
        return {
            date: date.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            time: date.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
            }),
        }
    }

    const handleConfirm = async () => {
        setIsConfirming(true)

        try {
            const response = await fetch('/api/appointments/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    appointmentId: appointment.id,
                    mentorNotes: mentorNotes.trim() || undefined,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao confirmar agendamento')
            }

            // Mensagem de sucesso baseada no resultado
            const description = data.googleMeetLink
                ? 'Um evento foi criado no Google Calendar com link do Meet.'
                : data.calendarError
                    ? `Mentoria confirmada, mas houve um problema ao criar o evento: ${data.calendarError}`
                    : 'Mentoria confirmada com sucesso!';

            toast.success('Agendamento confirmado!', {
                description,
            })

            setIsDialogOpen(false)
            setMentorNotes('')

            if (onConfirmed) {
                onConfirmed(data.appointment)
            }

        } catch (error) {
            console.error('Error confirming appointment:', error)
            toast.error('Erro ao confirmar agendamento', {
                description: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
            })
        } finally {
            setIsConfirming(false)
        }
    }

    const { date, time } = formatDateTime(appointment.scheduled_at)

    return (
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setIsDialogOpen(true)}
                >
                    <Calendar className="w-4 h-4 mr-2" />
                    Confirmar Mentoria
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent className="max-w-lg">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        Confirmar Mentoria
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-4 text-left">
                            <p className="text-sm text-gray-600">
                                Você está prestes a confirmar esta sessão de mentoria.
                                Um evento será criado automaticamente no Google Calendar com link do Meet.
                            </p>

                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium">Mentee:</span>
                                    <span>{appointment.mentee.full_name}</span>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium">Data:</span>
                                    <span className="capitalize">{date}</span>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium">Horário:</span>
                                    <span>{time} ({appointment.duration_minutes} min)</span>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                    <Video className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium">Meet:</span>
                                    <span>Link será gerado automaticamente</span>
                                </div>

                                {appointment.notes && (
                                    <div className="pt-2 border-t">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Mensagem do mentee:</p>
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{appointment.notes}</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="mentor-notes" className="text-sm font-medium text-gray-700">
                                    Observações (opcional)
                                </label>
                                <textarea
                                    id="mentor-notes"
                                    value={mentorNotes}
                                    onChange={(e) => setMentorNotes(e.target.value)}
                                    placeholder="Adicione observações sobre a mentoria, preparação necessária, etc..."
                                    className="w-full min-h-[100px] p-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                    disabled={isConfirming}
                                />
                                <p className="text-xs text-gray-500">
                                    Estas observações serão incluídas no evento do Google Calendar e visíveis para o mentee.
                                </p>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isConfirming}>
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isConfirming}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isConfirming ? 'Confirmando...' : 'Confirmar Mentoria'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}