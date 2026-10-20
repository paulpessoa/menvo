'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MenvoDots } from "@/components/ui/menvo-loader";
import { ApiClientError } from '@/lib/query/http';
import { useConfirmAppointment } from '@/hooks/appointments/useConfirmAppointment';

/**
 * Landing page of the "confirm" link in the mentor's e-mail. Confirms by token on
 * mount; the server's message (including 410 "Este link expirou...") is shown as is.
 */
export default function ConfirmAppointmentPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const t = useTranslations('appointments.confirm');
    const token = searchParams.get('token');
    const confirm = useConfirmAppointment();
    const requestedToken = useRef<string | null>(null);

    useEffect(() => {
        // One request per token, even when React re-runs the effect (Strict Mode).
        if (!token || requestedToken.current === token) return;
        requestedToken.current = token;
        confirm.mutate({ token });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const status: 'loading' | 'success' | 'error' = !token
        ? 'error'
        : confirm.isSuccess
          ? 'success'
          : confirm.isError
            ? 'error'
            : 'loading';

    let message = '';
    if (!token) {
        message = t('invalidToken');
    } else if (confirm.isSuccess) {
        message = confirm.data.message || t('successTitle');
    } else if (confirm.error instanceof ApiClientError) {
        const serverError = confirm.error.body?.error;
        message = (typeof serverError === 'string' && serverError) || t('errorTitle');
    } else if (confirm.isError) {
        message = t('networkError');
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                {status === 'loading' && (
                    <div className="text-center">
                        <MenvoDots className="justify-center mb-6" />
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
                            onClick={() => router.push('/mentorship/mentor#upcoming')}
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
