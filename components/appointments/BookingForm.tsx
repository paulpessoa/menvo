'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, MessageSquare } from 'lucide-react';
import { AvailableTimeSlot } from '@/types/appointments';
import { toast } from 'sonner';

interface BookingFormProps {
    mentorId: string;
    mentorName: string;
    onSuccess?: (appointmentId: number) => void;
    onCancel?: () => void;
}

export default function BookingForm({
    mentorId,
    mentorName,
    onSuccess,
    onCancel
}: BookingFormProps) {
    const [availableSlots, setAvailableSlots] = useState<AvailableTimeSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<AvailableTimeSlot | null>(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingSlots, setFetchingSlots] = useState(true);

    // Fetch available slots
    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                setFetchingSlots(true);

                // Get next 14 days
                const startDate = new Date().toISOString().split('T')[0];
                const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                const response = await fetch(
                    `/api/appointments/availability?mentor_id=${mentorId}&start_date=${startDate}&end_date=${endDate}`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch availability');
                }

                const data = await response.json();
                setAvailableSlots(data.availableSlots || []);
            } catch (error) {
                console.error('Error fetching availability:', error);
                toast.error('Erro ao carregar horários disponíveis');
            } finally {
                setFetchingSlots(false);
            }
        };

        fetchAvailability();
    }, [mentorId]);

    const handleBooking = async () => {
        if (!selectedSlot) {
            toast.error('Selecione um horário');
            return;
        }

        try {
            setLoading(true);

            const response = await fetch('/api/appointments/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mentor_id: mentorId,
                    scheduled_at: selectedSlot.datetime,
                    duration_minutes: 60,
                    message: message.trim() || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create appointment');
            }

            const data = await response.json();
            toast.success('Agendamento criado com sucesso!');

            if (onSuccess) {
                onSuccess(data.appointment.id);
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao criar agendamento');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (timeString: string) => {
        return timeString;
    };

    // Group slots by date
    const slotsByDate = availableSlots.reduce((acc, slot) => {
        const date = slot.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(slot);
        return acc;
    }, {} as Record<string, AvailableTimeSlot[]>);

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Agendar Mentoria
                </CardTitle>
                <CardDescription>
                    Agende uma sessão de mentoria com {mentorName}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Available Slots */}
                <div>
                    <Label className="text-base font-medium">Horários Disponíveis</Label>

                    {fetchingSlots ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : availableSlots.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhum horário disponível nos próximos 14 dias</p>
                            <p className="text-sm">Entre em contato diretamente com o mentor</p>
                        </div>
                    ) : (
                        <div className="space-y-4 mt-3">
                            {Object.entries(slotsByDate).map(([date, slots]) => (
                                <div key={date}>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                                        {formatDate(date)}
                                    </h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {slots.map((slot) => (
                                            <Button
                                                key={slot.datetime}
                                                variant={selectedSlot?.datetime === slot.datetime ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setSelectedSlot(slot)}
                                                className="justify-center"
                                            >
                                                {formatTime(slot.time)}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Selected Slot Display */}
                {selectedSlot && (
                    <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">Horário selecionado:</span>
                            <span>
                                {formatDate(selectedSlot.date)} às {formatTime(selectedSlot.time)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Message */}
                <div>
                    <Label htmlFor="message" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Mensagem (opcional)
                    </Label>
                    <Textarea
                        id="message"
                        placeholder="Descreva brevemente o que você gostaria de discutir na mentoria..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="mt-2"
                        rows={3}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    {onCancel && (
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            disabled={loading}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                    )}
                    <Button
                        onClick={handleBooking}
                        disabled={!selectedSlot || loading}
                        className="flex-1"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Agendando...
                            </>
                        ) : (
                            <>
                                <User className="h-4 w-4 mr-2" />
                                Confirmar Agendamento
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
