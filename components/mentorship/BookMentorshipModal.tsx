'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

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
    const [loading, setLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [pendingEvaluation, setPendingEvaluation] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadAvailability();
        }
    }, [isOpen, mentorId]);

    const loadAvailability = async () => {
        try {
            setLoading(true);
            setError('');
            setPendingEvaluation(false);
            setAvailableSlots([]);

            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (user) {
                // Verificar se o usuário tem mentorias concluídas sem feedback
                const { data: completed } = await supabase
                    .from('appointments')
                    .select('id')
                    .eq('mentee_id', user.id)
                    .eq('status', 'completed');
                
                if (completed && completed.length > 0) {
                    const { data: feedbacks } = await supabase
                        .from('appointment_feedbacks')
                        .select('appointment_id')
                        .eq('reviewer_id', user.id);
                    
                    const feedbackIds = new Set(feedbacks?.map(f => f.appointment_id));
                    const pending = completed.some(c => !feedbackIds.has(c.id));
                    
                    if (pending) {
                        setPendingEvaluation(true);
                        setLoading(false);
                        return;
                    }
                }
            }

            // Usar a API de availability que já filtra horários ocupados
            const startDate = new Date().toISOString().split('T')[0];
            const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const response = await fetch(
                `/api/appointments/availability?mentor_id=${mentorId}&start_date=${startDate}&end_date=${endDate}`
            );

            if (!response.ok) {
                throw new Error('Erro ao carregar disponibilidade');
            }

            const data = await response.json();

            // Converter para o formato TimeSlot esperado
            const slots: TimeSlot[] = (data.availableSlots || []).map((slot: any) => {
                const date = new Date(slot.datetime);
                return {
                    date,
                    day_of_week: date.getDay(),
                    formatted_date: date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }),
                    formatted_time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    datetime: slot.datetime,
                };
            });

            setAvailableSlots(slots);
        } catch (err) {
            console.error('Erro ao carregar disponibilidade:', err);
            setError('Erro ao carregar horários disponíveis');
        } finally {
            setLoading(false);
        }
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
                    duration: 45, // Duração fixa de 45 minutos
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
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-none">
                <div className="bg-white rounded-lg overflow-hidden flex flex-col h-full">
                    <DialogHeader className="p-6 border-b bg-gray-50">
                        <DialogTitle className="text-2xl font-bold text-gray-900">
                            Agendar Mentoria com {mentorName}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground animate-pulse text-center">Buscando horários disponíveis do mentor...</p>
                            </div>
                        ) : pendingEvaluation ? (
                            <div className="py-12 text-center space-y-4">
                                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto text-yellow-600">
                                    <Star className="w-10 h-10 fill-current" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Avaliação Pendente</h3>
                                <p className="text-gray-600 max-w-sm mx-auto">
                                    Você tem uma mentoria concluída que ainda não foi avaliada. 
                                    Por favor, avalie sua última sessão para liberar novos agendamentos.
                                </p>
                                <Button asChild className="mt-6">
                                    <Link href="/mentorship/mentee">
                                        Ver minhas mentorias
                                    </Link>
                                </Button>
                            </div>
                        ) : error ? (
                            <div className="py-12 text-center space-y-4">
                                <div className="bg-red-50 text-red-700 p-4 rounded-lg inline-block">
                                    {error}
                                </div>
                                <Button variant="outline" onClick={loadAvailability}>Tentar novamente</Button>
                            </div>
                        ) : !selectedSlot ? (
                            // Mostrar horários disponíveis
                            <div className="space-y-6">
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                                    <div className="bg-blue-500 text-white rounded-full p-1 mt-0.5">
                                        <Clock className="w-3 h-3" />
                                    </div>
                                    <p className="text-sm text-blue-800 leading-relaxed">
                                        As mentorias do <strong>{mentorName}</strong> têm duração padrão de <strong>45 minutos</strong>. Selecione um horário abaixo para prosseguir.
                                    </p>
                                </div>

                                {availableSlots.length === 0 ? (
                                    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                        <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                        <h3 className="text-lg font-medium text-gray-900">Nenhum horário disponível</h3>
                                        <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                                            Não encontramos horários livres nas próximas 2 semanas. Tente novamente mais tarde.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {availableSlots.map((slot, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleBookSlot(slot)}
                                                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-primary hover:ring-1 hover:ring-primary hover:bg-primary/5 transition-all text-left group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-gray-100 rounded-xl group-hover:bg-primary/10 transition-colors">
                                                        <span className="text-[10px] uppercase font-bold text-gray-500 group-hover:text-primary">
                                                            {slot.formatted_date.split(',')[0]}
                                                        </span>
                                                        <span className="text-xl font-black text-gray-900 group-hover:text-primary">
                                                            {slot.date.getDate()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 capitalize">
                                                            {DAYS_OF_WEEK[slot.day_of_week]}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {slot.formatted_time} • 45min
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                    <Plus className="w-4 h-4" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Confirmação do agendamento
                            <div className="space-y-6">
                                <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Calendar className="w-20 h-20 text-primary" />
                                    </div>
                                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-4">Horário selecionado</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-lg capitalize">
                                                {DAYS_OF_WEEK[selectedSlot.day_of_week]}, {selectedSlot.formatted_date}
                                            </p>
                                            <p className="text-primary font-medium">
                                                Às {selectedSlot.formatted_time} (Duração: 45 min)
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label htmlFor="message" className="block text-sm font-bold text-gray-900">
                                        O que você gostaria de discutir nessa mentoria? *
                                    </label>
                                    <textarea
                                        id="message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Ex: Gostaria de tirar dúvidas sobre arquitetura de software e receber dicas para o mercado internacional..."
                                        rows={5}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none text-sm"
                                    />
                                    <div className="flex justify-between items-center px-1">
                                        <p className={`text-[10px] font-medium ${message.length < 20 ? 'text-red-500' : 'text-green-600'}`}>
                                            Mínimo de 20 caracteres: {message.length}/20
                                        </p>
                                        <p className="text-[10px] text-gray-400">Campos marcados com * são obrigatórios</p>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-shake">
                                        ⚠️ {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> Solicitação enviada! Redirecionando...
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedSlot(null)}
                                        disabled={isSubmitting}
                                        className="flex-1 h-12 rounded-xl"
                                    >
                                        Escolher outro horário
                                    </Button>
                                    <Button
                                        onClick={handleConfirmBooking}
                                        disabled={isSubmitting || message.length < 20}
                                        className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Processando...
                                            </>
                                        ) : (
                                            'Confirmar Agendamento'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
