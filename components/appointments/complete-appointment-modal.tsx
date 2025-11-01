"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'

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

    const supabase = createClient()
    const otherPerson = isMentor ? appointment.mentee : appointment.mentor
    const otherPersonRole = isMentor ? 'mentee' : 'mentor'

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Por favor, selecione uma avaliação')
            return
        }

        setIsSubmitting(true)

        try {
            // 1. Criar feedback
            const { error: feedbackError } = await supabase
                .from('appointment_feedbacks')
                .insert({
                    appointment_id: appointment.id,
                    reviewer_id: currentUserId,
                    reviewed_id: otherPerson.id,
                    rating,
                    private_notes: privateNotes.trim() || null,
                    public_feedback: publicFeedback.trim() || null
                })

            if (feedbackError) throw feedbackError

            // 2. Marcar appointment como completed
            // Como apenas o mentee avalia, marcamos como completed imediatamente
            const { error: updateError } = await supabase
                .from('appointments')
                .update({
                    status: 'completed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', appointment.id)

            if (updateError) throw updateError

            toast.success('Mentoria avaliada com sucesso!', {
                description: 'Seu feedback foi registrado.'
            })

            onOpenChange(false)

            // Reset form
            setRating(0)
            setPrivateNotes('')
            setPublicFeedback('')

            if (onCompleted) {
                onCompleted()
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                                    className="transition-transform hover:scale-110"
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
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
