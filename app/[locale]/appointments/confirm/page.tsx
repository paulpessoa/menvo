'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function ConfirmAppointmentPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const t = useTranslations('appointments.confirm');
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage(t('invalidToken'));
            return;
        }

        confirmAppointment();
    }, [token, t]);

    async function confirmAppointment() {
        try {
            const response = await fetch('/api/appointments/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setStatus('error');
                setMessage(data.error || t('errorTitle'));
                return;
            }

            setStatus('success');
            setMessage(data.message || t('successTitle'));
        } catch (error) {
            console.error('[CONFIRM] Erro inesperado:', error);
            setStatus('error');
            setMessage(t('networkError'));
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                {status === 'loading' && (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            {t('title')}
                        </h2>
                        <p className="text-gray-600">{t('waitingMessage')}</p>
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
                            {t('successTitle')}
                        </h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <button
                            onClick={() => router.push('/mentorship/mentor')}
                            className="w-full bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                        >
                            {t('viewAppointment')}
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
                            {t('errorTitle')}
                        </h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full bg-muted-foreground text-white font-semibold px-4 py-2 rounded-md hover:bg-muted-foreground/90 transition-colors"
                        >
                            {t('goToDashboard')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
