'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function ConfirmAppointmentPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token inválido ou ausente');
            return;
        }

        confirmAppointment();
    }, [token]);

    async function confirmAppointment() {
        try {
            const supabase = createClient();

            // Buscar appointment pelo token
            const { data: appointment, error: fetchError } = await supabase
                .from('appointments')
                .select('*')
                .eq('action_token', token)
                .single();

            if (fetchError || !appointment) {
                setStatus('error');
                setMessage('Agendamento não encontrado ou token inválido');
                return;
            }

            // Verificar se já foi confirmado
            if (appointment.status === 'confirmed') {
                setStatus('success');
                setMessage('Este agendamento já foi confirmado anteriormente!');
                return;
            }

            // Verificar se está pendente
            if (appointment.status !== 'pending') {
                setStatus('error');
                setMessage(`Este agendamento está com status: ${appointment.status}`);
                return;
            }

            // Atualizar status para confirmed
            const { error: updateError } = await supabase
                .from('appointments')
                .update({ status: 'confirmed' })
                .eq('id', appointment.id);

            if (updateError) {
                console.error('[CONFIRM] Erro ao atualizar status:', updateError);
                setStatus('error');
                setMessage('Erro ao confirmar agendamento');
                return;
            }

            // Chamar API para criar evento no Google Calendar e enviar emails
            try {
                const response = await fetch('/api/appointments/confirm', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        appointmentId: appointment.id,
                    }),
                });

                if (!response.ok) {
                    console.error('[CONFIRM] Erro ao processar confirmação completa');
                    // Não falhar, pois o status já foi atualizado
                }
            } catch (apiError) {
                console.error('[CONFIRM] Erro ao chamar API de confirmação:', apiError);
                // Não falhar, pois o status já foi atualizado
            }

            setStatus('success');
            setMessage('Agendamento confirmado com sucesso! Você receberá um email de confirmação em breve.');
        } catch (error) {
            console.error('[CONFIRM] Erro inesperado:', error);
            setStatus('error');
            setMessage('Erro inesperado ao confirmar agendamento');
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                {status === 'loading' && (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Confirmando agendamento...
                        </h2>
                        <p className="text-gray-600">Por favor, aguarde.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <svg
                                className="h-6 w-6 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Sucesso!
                        </h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <button
                            onClick={() => router.push('/mentor/appointments')}
                            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                        >
                            Ver meus agendamentos
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <svg
                                className="h-6 w-6 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Erro
                        </h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                        >
                            Voltar para início
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
