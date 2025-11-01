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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { X, Calendar, Clock, User } from 'lucide-react'
import { toast } from 'sonner'

interface Appointment {
    id: string | number
    scheduled_at: string
    duration_minutes: number
    notes?: string
    mentee?: {
        full_name: string
        email: string
    }
    mentor?: {
        full_name: string
        email: string
    }
}

interface CancelAppointmentButtonProps {
    appointment: Appointment
    onCancelled?: (appointment: any) => void
    variant?: 'destructive' | 'outline'
    size?: 'sm' | 'default'
}

export function CancelAppointmentButton({
    appointment,
    onCancelled,
    variant = 'destructive',
    size = 'sm'
}: CancelAppointmentButtonProps) {
    const [isCancelling, setIsCancelling] = useState(false)
    const [reason, setReason] = useState('')
    const [isOpen, setIsOpen] = useState(false)

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

    const handleCancel = async () => {
        if (!reason.trim()) {
            toast.error('Por favor, informe o motivo do cancelamento')
            return
        }

        setIsCancelling(true)

        try {
            const response = await fetch('/api/appointments/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    appointmentId: appointment.id,
                    reason: reason.trim(),
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao cancelar agendamento')
            }

            toast.success('Agendamento cancelado com sucesso!', {
                description: 'O evento foi removido do Google Calendar.',
            })

            setIsOpen(false)
            setReason('')

            if (onCancelled) {
                onCancelled(data.appointment)
            }

        } catch (error) {
            console.error('Error cancelling appointment:', error)
            toast.error('Erro ao cancelar agendamento', {
                description: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
            })
        } finally {
            setIsCancelling(false)
        }
    }

    const { date, time } = formatDateTime(appointment.scheduled_at)
    const otherPerson = appointment.mentee || appointment.mentor

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    onClick={() => {
                        setIsOpen(true);
                    }}
                >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <X className="w-5 h-5" />
                        Cancelar Mentoria
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-4 text-left">
                            <p className="text-gray-600">
                                Você está prestes a cancelar esta sessão de mentoria.
                                O evento será removido do Google Calendar automaticamente.
                            </p>

                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                {otherPerson && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">
                                            {appointment.mentee ? 'Mentee:' : 'Mentor:'}
                                        </span>
                                        <span>{otherPerson.full_name}</span>
                                    </div>
                                )}

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
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason">Motivo do cancelamento *</Label>
                                <Textarea
                                    id="reason"
                                    placeholder="Explique o motivo do cancelamento..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="min-h-[80px]"
                                />
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isCancelling}>
                        Voltar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleCancel}
                        disabled={isCancelling || !reason.trim()}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isCancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}