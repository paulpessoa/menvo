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
import { Badge } from '@/components/ui/badge'
import { X, Calendar, Clock, User, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'

interface AppointmentParticipant {
    id?: string
    full_name: string
    email?: string
}

interface Appointment {
    id: string | number
    scheduled_at: string
    duration_minutes: number
    notes?: string
    mentor_id?: string
    mentee_id?: string
    mentee?: AppointmentParticipant
    mentor?: AppointmentParticipant
}

interface CancelAppointmentButtonProps {
    appointment: Appointment
    onCancelled?: (appointment: any) => void
    variant?: 'destructive' | 'outline'
    size?: 'sm' | 'default'
}

const QUICK_REASONS = [
    "Conflito de agenda de última hora",
    "Emergência pessoal / saúde",
    "Problemas técnicos / conexão",
    "Outro motivo"
]

/**
 * Botão e Modal de Cancelamento de Mentoria.
 * Apresenta comunicação direcionada (mentor vs. mentee), identificação clara
 * da outra parte, chips de motivos rápidos e aviso transparente.
 */
export function CancelAppointmentButton({
    appointment,
    onCancelled,
    variant = 'destructive',
    size = 'sm'
}: CancelAppointmentButtonProps) {
    const { user } = useAuth()
    const [isCancelling, setIsCancelling] = useState(false)
    const [reason, setReason] = useState('')
    const [selectedQuickReason, setSelectedQuickReason] = useState<string | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    // Detecta se quem está cancelando é o Mentor ou o Mentorado
    const isMentor = appointment.mentor_id === user?.id || appointment.mentor?.id === user?.id
    const otherPerson = isMentor ? appointment.mentee : appointment.mentor
    const otherRoleLabel = isMentor ? "Mentorado(a)" : "Mentor(a)"

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

    const handleSelectQuickReason = (qr: string) => {
        setSelectedQuickReason(qr)
        if (qr === "Outro motivo") {
            setReason('')
        } else {
            setReason(qr)
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
                description: 'O evento foi removido do Google Calendar e os envolvidos foram informados.',
            })

            setIsOpen(false)
            setReason('')
            setSelectedQuickReason(null)

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

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    onClick={() => {
                        setIsOpen(true)
                    }}
                    className="font-medium rounded-xl"
                >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent className="max-w-lg rounded-2xl p-6">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600 text-xl font-bold">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        Cancelar Mentoria
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-4 text-left pt-1">
                            {/* Mensagem contextual por papel */}
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {isMentor
                                    ? "Entendemos que imprevistos acontecem. Ao confirmar o cancelamento, seu mentorado será notificado para que possa escolher um novo horário e o evento será desmarcado no Google Calendar."
                                    : "Sentiremos sua falta nesta sessão. Ao confirmar o cancelamento, liberamos o horário do seu mentor para outros jovens e o evento é removido do Google Calendar."
                                }
                            </p>

                            {/* Detalhes da Sessão */}
                            <div className="bg-muted/40 border border-border/80 p-4 rounded-xl space-y-2.5">
                                {otherPerson && (
                                    <div className="flex items-center gap-2.5 text-sm">
                                        <User className="w-4 h-4 text-primary shrink-0" />
                                        <span className="font-semibold text-foreground">
                                            {otherRoleLabel}:
                                        </span>
                                        <span className="text-foreground truncate">{otherPerson.full_name}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2.5 text-sm">
                                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                                    <span className="font-semibold text-foreground">Data:</span>
                                    <span className="capitalize text-foreground">{date}</span>
                                </div>

                                <div className="flex items-center gap-2.5 text-sm">
                                    <Clock className="w-4 h-4 text-primary shrink-0" />
                                    <span className="font-semibold text-foreground">Horário:</span>
                                    <span className="text-foreground">{time} ({appointment.duration_minutes || 45} min)</span>
                                </div>
                            </div>

                            {/* Motivos rápidos (Chips) */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Motivo do cancelamento *
                                </Label>
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    {QUICK_REASONS.map((qr) => {
                                        const isSelected = selectedQuickReason === qr
                                        return (
                                            <button
                                                key={qr}
                                                type="button"
                                                onClick={() => handleSelectQuickReason(qr)}
                                                className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer text-left ${
                                                    isSelected
                                                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                                                        : "border-border/80 bg-card hover:bg-muted/50 text-muted-foreground"
                                                }`}
                                            >
                                                {qr}
                                            </button>
                                        )
                                    })}
                                </div>

                                <Textarea
                                    id="cancel-reason"
                                    placeholder={
                                        selectedQuickReason === "Outro motivo"
                                            ? "Explique brevemente o motivo..."
                                            : "Detalhes adicionais (opcional se selecionou um motivo acima)..."
                                    }
                                    value={reason}
                                    onChange={(e) => {
                                        setReason(e.target.value)
                                        if (selectedQuickReason && e.target.value !== selectedQuickReason) {
                                            setSelectedQuickReason("Outro motivo")
                                        }
                                    }}
                                    className="min-h-[75px] rounded-xl text-sm"
                                />
                                <p className="text-[11px] text-muted-foreground leading-normal">
                                    Este motivo é compartilhado com {otherPerson ? otherPerson.full_name : "a outra pessoa"} para garantir transparência e consideração com a agenda de todos.
                                </p>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="pt-2 sm:pt-4">
                    <AlertDialogCancel
                        disabled={isCancelling}
                        className="rounded-xl font-semibold"
                    >
                        Voltar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleCancel}
                        disabled={isCancelling || !reason.trim()}
                        className="rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs"
                    >
                        {isCancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
