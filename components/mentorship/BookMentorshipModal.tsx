'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface TimeSlot {
    day_of_week: number;
    start_time: string;
    end_time: string;
    date: Date;
    formatted_date: string;
    formatted_time: string;
}

interface BookMentorshipModalProps {
    isOpen: boolean;
    onClose: () => void;
    mentorId: string;
    mentorName: string;
}

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function BookMentorshipModal({
    isOpen,
    onClose,
    mentorId,
    mentorName,
}: BookMentorshipModalProps) {
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadAvailability();
        }
    }, [isOpen, mentorId]);

    const loadAvailability = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/mentors/${mentorId}/availability`);

            if (!response.ok) {
                throw new Error('Erro ao carregar disponibilidade');
            }

            const data = await response.json();

            // Gerar próximos slots disponíveis (próximas 2 semanas)
            const slots = generateUpcomingSlots(data);
            setAvailableSlots(slots);
        } catch (err) {
            console.error('Erro ao carregar disponibilidade:', err);
            setError('Erro ao carregar horários disponíveis');
        } finally {
            setLoading(false);
        }
    };

    const generateUpcomingSlots = (availability: any[]): TimeSlot[] => {
        const slots: TimeSlot[] = [];
        const today = new Date();
        const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

        // Para cada dia nas próximas 2 semanas
        for (let d = new Date(today); d <= twoWeeksFromNow; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();

            // Encontrar disponibilidade para este dia da semana
            const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek);

            dayAvailability.forEach(slot => {
                const slotDate = new Date(d);
                const [hours, minutes] = slot.start_time.split(':');
                slotDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                // Só adicionar se for no futuro
                if (slotDate > today) {
                    slots.push({
                        day_of_week: dayOfWeek,
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                        date: slotDate,
                        formatted_date: slotDate.toLocaleDateString('pt-BR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                        }),
                        formatted_time: `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`,
                    });
                }
            });
        }

        return slots.slice(0, 20); // Limitar a 20 slots
    };

    const handleBookSlot = (slot: TimeSlot) => {
        setSelectedSlot(slot);
        setError('');
    };

    const handleConfirmBooking = async () => {
        if (!selectedSlot || !message.trim()) {
            setError('Por favor, preencha a mensagem');
            return;
        }

        if (message.length < 20) {
            setError('A mensagem deve ter pelo menos 20 caracteres');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/appointments/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mentorId,
                    scheduledAt: selectedSlot.date.toISOString(),
                    duration: 60, // Padrão 60 minutos
                    message: message.trim(),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao agendar mentoria');
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
                resetForm();
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao agendar mentoria');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedSlot(null);
        setMessage('');
        setError('');
        setSuccess(false);
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
            resetForm();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Agendar Mentoria com {mentorName}
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                ) : !selectedSlot ? (
                    // Mostrar horários disponíveis
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Selecione um horário disponível:
                        </p>

                        {availableSlots.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Nenhum horário disponível no momento</p>
                                <p className="text-sm mt-2">
                                    O mentor ainda não configurou sua disponibilidade
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                                {availableSlots.map((slot, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleBookSlot(slot)}
                                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg">
                                                <span className="text-xs font-medium text-indigo-600">
                                                    {slot.formatted_date.split(',')[0]}
                                                </span>
                                                <span className="text-lg font-bold text-indigo-600">
                                                    {slot.date.getDate()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {DAYS_OF_WEEK[slot.day_of_week]}
                                                </p>
                                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {slot.formatted_time}
                                                </p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline">
                                            Agendar
                                        </Button>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // Confirmação do agendamento
                    <div className="space-y-4">
                        <div className="bg-indigo-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">Horário selecionado:</p>
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {DAYS_OF_WEEK[selectedSlot.day_of_week]}, {selectedSlot.formatted_date}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {selectedSlot.formatted_time}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                Por que você quer esta mentoria? *
                            </label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Descreva suas dúvidas e o que você gostaria de discutir na mentoria..."
                                rows={5}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Mínimo de 20 caracteres ({message.length}/20)
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                                ✅ Solicitação enviada com sucesso!
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedSlot(null)}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                Voltar
                            </Button>
                            <Button
                                onClick={handleConfirmBooking}
                                disabled={isSubmitting || message.length < 20}
                                className="flex-1"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    'Confirmar Agendamento'
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
