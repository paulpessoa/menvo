'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, Volume2, Globe } from 'lucide-react'

export function VoiceDemo() {
    return (
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-blue-900 dark:text-blue-100">
                        🎤 Novo: Responda por Voz!
                    </CardTitle>
                </div>
                <CardDescription className="text-blue-800 dark:text-blue-200">
                    Agora você pode responder falando. Sua voz será transcrita automaticamente em tempo real.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-white dark:bg-gray-800">
                            <Volume2 className="h-3 w-3 mr-1" />
                            Transcrição em tempo real
                        </Badge>
                        <Badge variant="outline" className="bg-white dark:bg-gray-800">
                            <Globe className="h-3 w-3 mr-1" />
                            Português brasileiro
                        </Badge>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Como usar:</strong> Nas questões abertas, clique em "Falar" abaixo da caixa de texto.
                        Sua fala aparecerá em tempo real conforme você fala!
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                        * Funciona melhor no Chrome, Edge e Safari. Certifique-se de permitir o acesso ao microfone.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
