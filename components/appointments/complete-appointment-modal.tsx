"use client"

import { MenvoDots } from "@/components/ui/menvo-loader"
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star, CheckCircle2, CalendarPlus } from "lucide-react"
import { toast } from 'sonner'
import { Link } from '@/i18n/routing'
import { mentorshipService } from '@/lib/services/mentorship/mentorship.service'

interface CompleteAppointmentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appointment: {
        id: string | number
        mentor: {
            id: string
            full_name: string
        }
        mentee: {
            id: string
            full_name: string
        }
    }
    currentUserId: string
    isMentor: boolean
    onCompleted?: () => void
}

export function CompleteAppointmentModal({
    open,
    onOpenChange,
    appointment,
    currentUserId,
    isMentor,
    onCompleted
}: CompleteAppointmentModalProps) {
    const [rating, setRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [privateNotes, setPrivateNotes] = useState('')
    const [publicFeedback, setPublicFeedback] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [justSubmitted, setJustSubmitted] = useState(false)

    const otherPerson = isMentor ? appointment.mentee : appointment.mentor
    const otherPersonRole = isMentor ? 'mentee' : 'mentor'

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Por favor, selecione uma avaliação')
            return
        }

        setIsSubmitting(true)

        try {
            await mentorshipService.submitFeedbackAndComplete({
                appointmentId: String(appointment.id),
                reviewerId: currentUserId,
                reviewedId: otherPerson.id,
                rating,
                privateNotes: privateNotes.trim() || null,
                publicFeedback: publicFeedback.trim() || null
            })

            toast.success('Mentoria avaliada com sucesso!', {
                description: 'Seu feedback foi registrado.'
            })

            if (onCompleted) {
                onCompleted()
            }

            // Mentee: em vez de fechar direto, oferece continuar a jornada com
            // o mesmo mentor. Mentor nunca chega aqui (avaliação é assimétrica).
            if (!isMentor) {
                setJustSubmitted(true)
            } else {
                onOpenChange(false)
            }

        } catch (error) {
            console.error('Error completing appointment:', error)
            toast.error('Erro ao avaliar mentoria', {
                description: error instanceof Error ? error.message : 'Tente novamente mais tarde.'
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleOpenChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen)
        if (!nextOpen) {
            // Reset only after the close animation reads the current state
            setTimeout(() => {
                setJustSubmitted(false)
                setRating(0)
                setPrivateNotes('')
                setPublicFeedback('')
            }, 200)
        }
    }

    if (justSubmitted) {
        return (
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-center">Avaliação enviada!</DialogTitle>
                        <DialogDescription className="text-center">
                            Obrigado por avaliar sua mentoria com {otherPerson.full_name}. Quer continuar sua evolução com {otherPersonRole === 'mentor' ? 'o mesmo mentor' : 'essa pessoa'}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-center gap-2">
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>
                            Fechar
                        </Button>
                        {otherPersonRole === 'mentor' && (
                            <Button asChild className="bg-primary hover:bg-primary/90 text-white font-medium shadow-sm">
                                <Link href={`/appointments/book/${otherPerson.id}`} onClick={() => handleOpenChange(false)}>
                                    <CalendarPlus className="h-4 w-4 mr-2" />
                                    Agendar de novo
                                </Link>
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Avaliar Sessão de Mentoria</DialogTitle>
                    <DialogDescription>
                        Como foi sua experiência com {otherPerson.full_name}? Sua avaliação ajuda outros mentees a escolherem mentores.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Rating */}
                    <div className="space-y-2">
                        <Label>Avaliação *</Label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded-md p-1 cursor-pointer"
                                    aria-label={`${star} ${star === 1 ? "estrela" : "estrelas"}`}
                                >
                                    <Star
                                        className={`h-8 w-8 ${star <= (hoveredRating || rating)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {rating === 1 && 'Muito insatisfeito'}
                                {rating === 2 && 'Insatisfeito'}
                                {rating === 3 && 'Neutro'}
                                {rating === 4 && 'Satisfeito'}
                                {rating === 5 && 'Muito satisfeito'}
                            </p>
                        )}
                    </div>

                    {/* Anotações Privadas */}
                    <div className="space-y-2">
                        <Label htmlFor="private-notes">
                            Minhas Anotações (Privadas)
                        </Label>
                        <Textarea
                            id="private-notes"
                            value={privateNotes}
                            onChange={(e) => setPrivateNotes(e.target.value)}
                            placeholder="Pontos importantes da conversa, o que aprendi, áreas para melhorar, próximos passos..."
                            className="min-h-[100px] resize-none"
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-muted-foreground">
                            🔒 Apenas você verá estas anotações
                        </p>
                    </div>

                    {/* Feedback Público */}
                    <div className="space-y-2">
                        <Label htmlFor="public-feedback">
                            Feedback Público sobre o Mentor
                        </Label>
                        <Textarea
                            id="public-feedback"
                            value={publicFeedback}
                            onChange={(e) => setPublicFeedback(e.target.value)}
                            placeholder={`Como foi a mentoria? O que você aprendeu? Recomendaria ${otherPerson.full_name} para outros mentees?`}
                            className="min-h-[100px] resize-none"
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-muted-foreground">
                            👁️ Este feedback será público e aparecerá no perfil do mentor
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || rating === 0}
                        className="bg-primary hover:bg-primary/90 text-white font-medium shadow-sm"
                    >
                        {isSubmitting ? (
                            <>
                                <MenvoDots className="mr-2" />
                                Avaliando...
                            </>
                        ) : (
                            'Avaliar Mentoria'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
