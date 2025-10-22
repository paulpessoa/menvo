'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AppointmentActionPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const action = searchParams.get('action') as 'confirm' | 'cancel';

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [reason, setReason] = useState('');

    const handleAction = async () => {
        if (!token || !action) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/appointments/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, reason }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao processar ação');
            }

            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    };

    if (!token || !action) {
        return (
            <div className="container mx-auto py-16 px-4">
                <Card className="max-w-md mx-auto">
                    <CardContent className="py-12 text-center">
                        <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                        <h2 className="text-xl font-bold mb-2">Link inválido</h2>
                        <p className="text-muted-foreground">
                            Este link não é válido ou expirou.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="container mx-auto py-16 px-4">
                <Card className="max-w-md mx-auto">
                    <CardContent className="py-12 text-center">
                        <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                        <h2 className="text-xl font-bold mb-2">
                            {action === 'confirm' ? 'Agendamento Confirmado!' : 'Agendamento Cancelado'}
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            {action === 'confirm'
                                ? 'O mentee será notificado sobre a confirmação.'
                                : 'O mentee será notificado sobre o cancelamento.'}
                        </p>
                        <Button asChild>
                            <a href="/">Voltar para o início</a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-16 px-4">
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>
                        {action === 'confirm' ? 'Confirmar Agendamento' : 'Cancelar Agendamento'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        {action === 'confirm'
                            ? 'Você está prestes a confirmar este agendamento de mentoria.'
                            : 'Você está prestes a cancelar este agendamento de mentoria.'}
                    </p>

                    {action === 'cancel' && (
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                Motivo do cancelamento (opcional)
                            </label>
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Ex: Conflito de agenda, imprevisto, etc."
                                rows={3}
                            />
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            onClick={handleAction}
                            disabled={loading}
                            className="flex-1"
                            variant={action === 'confirm' ? 'default' : 'destructive'}
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : action === 'confirm' ? (
                                'Confirmar'
                            ) : (
                                'Cancelar Agendamento'
                            )}
                        </Button>
                        <Button variant="outline" asChild>
                            <a href="/">Voltar</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
