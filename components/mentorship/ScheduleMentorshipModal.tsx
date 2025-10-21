'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface ScheduleMentorshipModalProps {
    isOpen: boolean;
    onClose: () => void;
    mentorId: string;
    mentorName: string;
}

export function ScheduleMentorshipModal({
    isOpen,
    onClose,
    mentorId,
    mentorName,
}: ScheduleMentorshipModalProps) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState<30 | 60>(60);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // Validação básica
            if (!date || !time || !message) {
                setError('Por favor, preencha todos os campos');
                setIsSubmitting(false);
                return;
            }

            if (message.length < 20) {
                setError('A mensagem deve ter pelo menos 20 caracteres');
                setIsSubmitting(false);
                return;
            }

            // Combinar data e hora em ISO string
            const scheduledAt = new Date(`${date}T${time}`).toISOString();

            // Chamar API
            const response = await fetch('/api/appointments/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mentorId,
                    scheduledAt,
                    duration,
                    message,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao agendar mentoria');
            }

            // Sucesso!
            setSuccess(true);
            setTimeout(() => {
                onClose();
                // Reset form
                setDate('');
                setTime('');
                setDuration(60);
                setMessage('');
                setSuccess(false);
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao agendar mentoria');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
            setError('');
            setSuccess(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Agendar Mentoria
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Mentor Info */}
                    <div className="bg-indigo-50 p-3 rounded-md">
                        <p className="text-sm text-gray-600">Mentor:</p>
                        <p className="font-semibold text-gray-900">{mentorName}</p>
                    </div>

                    {/* Date */}
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                            Data *
                        </label>
                        <input
                            type="date"
                            id="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Time */}
                    <div>
                        <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                            Horário *
                        </label>
                        <input
                            type="time"
                            id="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Duration */}
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                            Duração *
                        </label>
                        <select
                            id="duration"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value) as 30 | 60)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value={30}>30 minutos</option>
                            <option value={60}>60 minutos</option>
                        </select>
                    </div>

                    {/* Message */}
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                            Mensagem *
                        </label>
                        <textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Descreva suas dúvidas e o que você gostaria de discutir na mentoria..."
                            rows={4}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Mínimo de 20 caracteres ({message.length}/20)
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                            ✅ Solicitação enviada com sucesso! O mentor receberá um email.
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Enviando...' : 'Agendar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
