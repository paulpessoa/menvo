'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Copy, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function GoogleCalendarCallbackPage() {
    const searchParams = useSearchParams();
    const [code, setCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const authCode = searchParams.get('code');
        const authError = searchParams.get('error');

        if (authError) {
            setError(authError);
        } else if (authCode) {
            setCode(authCode);
        } else {
            setError('Nenhum código encontrado na URL');
        }
    }, [searchParams]);

    const copyToClipboard = () => {
        if (code) {
            navigator.clipboard.writeText(code);
            setCopied(true);
            toast.success('Código copiado!');
            setTimeout(() => setCopied(false), 3000);
        }
    };

    if (error) {
        return (
            <div className="container max-w-2xl mx-auto py-10 px-4">
                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-5 h-5" />
                            Erro na Autorização
                        </CardTitle>
                        <CardDescription>
                            Ocorreu um erro ao autorizar o Google Calendar
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-red-50 p-4 rounded-lg">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm text-gray-600">
                                Tente novamente executando o script de geração de token.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!code) {
        return (
            <div className="container max-w-2xl mx-auto py-10 px-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Carregando...</CardTitle>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-2xl mx-auto py-10 px-4">
            <Card className="border-green-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        Autorização Concedida!
                    </CardTitle>
                    <CardDescription>
                        Copie o código abaixo e cole no terminal
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Código */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Código de Autorização:
                        </label>
                        <div className="relative">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono text-sm break-all">
                                {code}
                            </div>
                            <Button
                                onClick={copyToClipboard}
                                className="absolute top-2 right-2"
                                size="sm"
                                variant={copied ? 'default' : 'outline'}
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Copiado!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copiar
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Instruções */}
                    <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                        <p className="text-sm font-medium text-blue-900">
                            📋 Próximos passos:
                        </p>
                        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                            <li>Copie o código acima (clique no botão "Copiar")</li>
                            <li>Volte para o terminal onde está rodando o script</li>
                            <li>Cole o código quando solicitado</li>
                            <li>Pressione Enter</li>
                            <li>O script vai gerar o refresh_token</li>
                        </ol>
                    </div>

                    {/* Aviso */}
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            ⚠️ <strong>Importante:</strong> Este código expira rapidamente.
                            Se demorar muito, você precisará gerar um novo código executando o script novamente.
                        </p>
                    </div>

                    {/* Informações técnicas (colapsável) */}
                    <details className="text-sm">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                            Informações técnicas
                        </summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded space-y-1 text-xs font-mono">
                            <p><strong>URL completa:</strong></p>
                            <p className="break-all text-gray-600">{window.location.href}</p>
                            <p className="mt-2"><strong>Código:</strong></p>
                            <p className="break-all text-gray-600">{code}</p>
                        </div>
                    </details>
                </CardContent>
            </Card>
        </div>
    );
}
