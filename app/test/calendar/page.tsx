'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function CalendarTestPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const testCalendarIntegration = async () => {
        try {
            setLoading(true);
            setResult(null);

            const response = await fetch('/api/calendar/test', {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data);
                toast.success('Evento de teste criado com sucesso!');
            } else {
                throw new Error(data.error || 'Erro desconhecido');
            }
        } catch (error) {
            console.error('Error testing calendar:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao testar integração');
            setResult({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' });
        } finally {
            setLoading(false);
        }
    };

    const getAuthUrl = async () => {
        try {
            const response = await fetch('/api/auth/google-calendar/authorize');
            const data = await response.json();

            if (response.ok && data.authUrl) {
                window.open(data.authUrl, '_blank');
            } else {
                toast.error('Erro ao gerar URL de autorização');
            }
        } catch (error) {
            console.error('Error getting auth URL:', error);
            toast.error('Erro ao gerar URL de autorização');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Teste da Integração Google Calendar</h1>
                    <p className="text-muted-foreground">
                        Teste a configuração da API do Google Calendar
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Configuração da API
                        </CardTitle>
                        <CardDescription>
                            Verifique se a integração com Google Calendar está funcionando
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3">
                            <Button onClick={getAuthUrl} variant="outline">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Autorizar Google Calendar
                            </Button>

                            <Button onClick={testCalendarIntegration} disabled={loading}>
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Testando...
                                    </>
                                ) : (
                                    <>
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Testar Integração
                                    </>
                                )}
                            </Button>
                        </div>

                        {result && (
                            <div className="mt-6 p-4 rounded-lg border">
                                <div className="flex items-center gap-2 mb-3">
                                    {result.success ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    <span className="font-medium">
                                        {result.success ? 'Sucesso!' : 'Erro'}
                                    </span>
                                </div>

                                {result.success ? (
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Event ID:</strong> {result.event.id}</p>
                                        <p><strong>HTML Link:</strong>
                                            <a
                                                href={result.event.htmlLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:underline ml-1"
                                            >
                                                Ver no Google Calendar
                                            </a>
                                        </p>
                                        {result.event.hangoutLink && (
                                            <p><strong>Google Meet:</strong>
                                                <a
                                                    href={result.event.hangoutLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:underline ml-1"
                                                >
                                                    Entrar na reunião
                                                </a>
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-sm text-red-600">
                                        <p><strong>Erro:</strong> {result.error}</p>

                                        {result.error.includes('invalid_grant') && (
                                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                                                <p className="font-medium">Como resolver:</p>
                                                <ol className="list-decimal list-inside mt-1 space-y-1">
                                                    <li>Clique em "Autorizar Google Calendar" acima</li>
                                                    <li>Complete o fluxo de autorização</li>
                                                    <li>Atualize o GOOGLE_CALENDAR_REFRESH_TOKEN no .env.local</li>
                                                    <li>Teste novamente</li>
                                                </ol>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Instruções de Configuração</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div>
                            <h4 className="font-medium">1. Variáveis de Ambiente Necessárias:</h4>
                            <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                                <li>GOOGLE_CALENDAR_CLIENT_ID</li>
                                <li>GOOGLE_CALENDAR_CLIENT_SECRET</li>
                                <li>GOOGLE_CALENDAR_REFRESH_TOKEN</li>
                                <li>GOOGLE_CALENDAR_REDIRECT_URI</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-medium">2. Para obter as credenciais:</h4>
                            <ol className="list-decimal list-inside ml-4 space-y-1 text-muted-foreground">
                                <li>Acesse o Google Cloud Console</li>
                                <li>Ative a Google Calendar API</li>
                                <li>Crie credenciais OAuth 2.0</li>
                                <li>Configure a tela de consentimento</li>
                                <li>Use o botão "Autorizar" acima para obter o refresh token</li>
                            </ol>
                        </div>

                        <div>
                            <h4 className="font-medium">3. Documentação completa:</h4>
                            <p className="text-muted-foreground ml-4">
                                Consulte o arquivo <code>docs/google-calendar-setup.md</code> para instruções detalhadas.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
