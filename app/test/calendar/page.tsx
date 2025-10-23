"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, XCircle, AlertCircle, Calendar, Loader2 } from 'lucide-react'

export default function TestCalendarPage() {
    const [testing, setTesting] = useState(false)
    const [result, setResult] = useState<any>(null)

    const testCalendarIntegration = async () => {
        setTesting(true)
        setResult(null)

        try {
            const response = await fetch('/api/calendar/test', {
                method: 'POST',
            })

            const data = await response.json()

            setResult({
                success: response.ok,
                data,
                status: response.status,
            })
        } catch (error) {
            setResult({
                success: false,
                data: { error: error instanceof Error ? error.message : 'Erro desconhecido' },
                status: 500,
            })
        } finally {
            setTesting(false)
        }
    }

    return (
        <div className="container max-w-4xl mx-auto py-10 px-4">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Teste de Integração - Google Calendar</h1>
                    <p className="text-muted-foreground mt-2">
                        Verifique se a integração com Google Calendar está funcionando corretamente
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Teste de Criação de Evento
                        </CardTitle>
                        <CardDescription>
                            Este teste vai criar um evento de teste no Google Calendar com link do Google Meet
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={testCalendarIntegration}
                            disabled={testing}
                            className="w-full"
                        >
                            {testing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Testando...
                                </>
                            ) : (
                                <>
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Testar Integração
                                </>
                            )}
                        </Button>

                        {result && (
                            <Alert variant={result.success ? 'default' : 'destructive'}>
                                {result.success ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    <XCircle className="h-4 w-4" />
                                )}
                                <AlertTitle>
                                    {result.success ? 'Sucesso!' : 'Erro'}
                                </AlertTitle>
                                <AlertDescription>
                                    <div className="mt-2 space-y-2">
                                        {result.success ? (
                                            <>
                                                <p className="font-medium">Evento criado com sucesso!</p>
                                                {result.data.event?.htmlLink && (
                                                    <a
                                                        href={result.data.event.htmlLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline block"
                                                    >
                                                        Ver evento no Google Calendar →
                                                    </a>
                                                )}
                                                {result.data.event?.hangoutLink && (
                                                    <a
                                                        href={result.data.event.hangoutLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline block"
                                                    >
                                                        Entrar no Google Meet →
                                                    </a>
                                                )}
                                                <pre className="mt-4 p-3 bg-gray-100 rounded text-xs overflow-auto">
                                                    {JSON.stringify(result.data, null, 2)}
                                                </pre>
                                            </>
                                        ) : (
                                            <>
                                                <p className="font-medium">Falha ao criar evento</p>
                                                <p className="text-sm">{result.data.error}</p>
                                                <pre className="mt-4 p-3 bg-gray-100 rounded text-xs overflow-auto">
                                                    {JSON.stringify(result.data, null, 2)}
                                                </pre>
                                            </>
                                        )}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Instruções de Configuração
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold">1. Configure as variáveis de ambiente</h3>
                            <p className="text-sm text-muted-foreground">
                                Adicione no seu <code className="bg-gray-100 px-1 rounded">.env.local</code>:
                            </p>
                            <pre className="p-3 bg-gray-100 rounded text-xs overflow-auto">
                                {`GOOGLE_CALENDAR_CLIENT_ID=seu_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=seu_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/auth/google-calendar/callback
GOOGLE_CALENDAR_REFRESH_TOKEN=seu_refresh_token`}
                            </pre>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold">2. Gere o refresh token</h3>
                            <p className="text-sm text-muted-foreground">
                                Execute o script para gerar o refresh token:
                            </p>
                            <pre className="p-3 bg-gray-100 rounded text-xs">
                                node scripts/generate-refresh-token.js
                            </pre>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold">3. Reinicie o servidor</h3>
                            <p className="text-sm text-muted-foreground">
                                Após adicionar as variáveis, reinicie o servidor de desenvolvimento
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold">4. Teste a integração</h3>
                            <p className="text-sm text-muted-foreground">
                                Clique no botão "Testar Integração" acima
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Documentação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <a
                            href="/GUIA_SETUP_GOOGLE_CALENDAR.md"
                            className="text-blue-600 hover:underline block"
                        >
                            📖 Guia Completo de Configuração
                        </a>
                        <a
                            href="/RELATORIO_GOOGLE_CALENDAR.md"
                            className="text-blue-600 hover:underline block"
                        >
                            📊 Relatório de Análise da Integração
                        </a>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
