'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Trophy,
    Users,
    Lightbulb,
    Target,
    Gift,
    ArrowRight,
    Loader2,
    CheckCircle,
    Heart,
    Sparkles
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AnalysisResult {
    pontuacao: number
    titulo_personalizado: string
    resumo_motivador: string
    mentores_sugeridos: Array<{
        tipo: string
        razao: string
        disponivel: boolean
        mentor_nome?: string
    }>
    conselhos_praticos: string[]
    proximos_passos: string[]
    areas_desenvolvimento: string[]
    mensagem_final: string
    potencial_mentor?: boolean
    areas_vida_pessoal?: string[]
}

interface QuizResponse {
    id: string
    name: string
    email: string
    score: number
    ai_analysis: AnalysisResult
    processed_at: string
}

export default function QuizResultsPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [response, setResponse] = useState<QuizResponse | null>(null)
    const [selectedGift, setSelectedGift] = useState<'caneta' | 'botton' | null>(null)

    useEffect(() => {
        loadResults()
    }, [params.id])

    const loadResults = async () => {
        try {
            const { createClient } = await import('@/utils/supabase/client')
            const supabase = createClient()

            const { data, error } = await supabase
                .from('quiz_responses')
                .select('*')
                .eq('id', params.id)
                .single()

            if (error) throw error

            // Wait for processing if not done yet
            if (!data.processed_at) {
                setTimeout(loadResults, 2000) // Retry after 2 seconds
                return
            }

            setResponse(data)
        } catch (error) {
            console.error('Error loading results:', error)
            toast({
                title: "Erro",
                description: "Não foi possível carregar os resultados.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    if (loading || !response) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                            <div className="text-center">
                                <h3 className="font-semibold text-lg">Processando sua análise...</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Nossa IA está analisando suas respostas
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const analysis = response.ai_analysis
    const score = response.score
    const hasGift = score >= 700

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header with Score */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-full text-purple-700 dark:text-purple-300 text-sm font-medium">
                            <Sparkles className="h-4 w-4" />
                            Sua Análise Personalizada
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold">
                            {analysis.titulo_personalizado}
                        </h1>

                        {/* Score Display */}
                        <div className="flex items-center justify-center gap-4">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full border-8 border-purple-200 dark:border-purple-800 flex items-center justify-center bg-white dark:bg-gray-800">
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-purple-600">{score}</div>
                                        <div className="text-xs text-muted-foreground">de 1000</div>
                                    </div>
                                </div>
                                {hasGift && (
                                    <div className="absolute -top-2 -right-2">
                                        <Trophy className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            {analysis.resumo_motivador}
                        </p>
                    </div>

                    {/* Gift Selection (if score >= 700) */}
                    {hasGift && (
                        <Card className="border-2 border-green-300 dark:border-green-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Gift className="h-6 w-6 text-green-600" />
                                    <CardTitle className="text-green-900 dark:text-green-100">
                                        🎉 Parabéns! Você ganhou um brinde!
                                    </CardTitle>
                                </div>
                                <CardDescription className="text-green-800 dark:text-green-200">
                                    Escolha seu brinde e retire no evento RecnPlay
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <Button
                                        variant={selectedGift === 'caneta' ? 'default' : 'outline'}
                                        className="h-20 text-lg"
                                        onClick={() => setSelectedGift('caneta')}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <span>✏️ Caneta</span>
                                            {selectedGift === 'caneta' && <CheckCircle className="h-4 w-4" />}
                                        </div>
                                    </Button>
                                    <Button
                                        variant={selectedGift === 'botton' ? 'default' : 'outline'}
                                        className="h-20 text-lg"
                                        onClick={() => setSelectedGift('botton')}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <span>📌 Botton</span>
                                            {selectedGift === 'botton' && <CheckCircle className="h-4 w-4" />}
                                        </div>
                                    </Button>
                                </div>
                                {selectedGift && (
                                    <p className="text-sm text-center mt-4 text-green-800 dark:text-green-200">
                                        Ótima escolha! Mostre este resultado no estande do MENVO para retirar seu {selectedGift}.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Mentors Suggested */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Users className="h-6 w-6 text-blue-600" />
                                <CardTitle>Mentores Sugeridos para Você</CardTitle>
                            </div>
                            <CardDescription>
                                Baseado nas suas áreas de interesse e objetivos
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {analysis.mentores_sugeridos.map((mentor, index) => (
                                <div key={index} className="p-4 border rounded-lg space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-lg">{mentor.tipo}</h4>
                                            {mentor.mentor_nome && (
                                                <p className="text-sm text-muted-foreground">
                                                    Mentor: {mentor.mentor_nome}
                                                </p>
                                            )}
                                        </div>
                                        <Badge variant={mentor.disponivel ? 'default' : 'secondary'}>
                                            {mentor.disponivel ? 'Disponível' : 'Em breve'}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{mentor.razao}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Practical Advice */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Lightbulb className="h-6 w-6 text-yellow-600" />
                                <CardTitle>Conselhos Práticos</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {analysis.conselhos_praticos.map((conselho, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>{conselho}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Next Steps */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Target className="h-6 w-6 text-purple-600" />
                                <CardTitle>Próximos Passos</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {analysis.proximos_passos.map((passo, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <ArrowRight className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                                        <span>{passo}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Development Areas */}
                    {analysis.areas_desenvolvimento && analysis.areas_desenvolvimento.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Áreas de Desenvolvimento</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.areas_desenvolvimento.map((area, index) => (
                                        <Badge key={index} variant="outline" className="text-sm">
                                            {area}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Potential Mentor Badge */}
                    {analysis.potencial_mentor && (
                        <Card className="border-2 border-purple-300 dark:border-purple-700">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <Heart className="h-12 w-12 text-purple-600 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-lg">Você tem potencial para ser mentor!</h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Identificamos que você tem interesse em compartilhar conhecimento. Considere se cadastrar como mentor voluntário na plataforma MENVO.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Separator />

                    {/* Final Message */}
                    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2">
                        <CardContent className="pt-6">
                            <p className="text-center text-lg font-medium mb-6">
                                {analysis.mensagem_final}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button
                                    size="lg"
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                    onClick={() => router.push('/auth/register')}
                                >
                                    Cadastrar na Plataforma MENVO
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => router.push('/')}
                                >
                                    Voltar ao Início
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Email Notice */}
                    <p className="text-center text-sm text-muted-foreground">
                        📧 Enviamos uma cópia desta análise para <strong>{response.email}</strong>
                    </p>
                </div>
            </div>
        </div>
    )
}
