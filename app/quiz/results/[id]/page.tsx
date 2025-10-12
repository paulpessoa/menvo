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
    Sparkles,
    Mail,
    Share2
} from 'lucide-react'
import Image from 'next/image'
import { AnimatedBackground } from '@/components/ui/animated-background'
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
    const [sendingEmail, setSendingEmail] = useState(false)

    useEffect(() => {
        loadResults()
    }, [params.id])

    const handleSendEmail = async () => {
        if (!response) return

        setSendingEmail(true)
        try {
            const { createClient } = await import('@/utils/supabase/client')
            const supabase = createClient()

            const { error } = await supabase.functions.invoke('send-quiz-email', {
                body: { responseId: response.id }
            })

            if (error) throw error

            toast({
                title: "Email enviado!",
                description: "Verifique sua caixa de entrada.",
            })
        } catch (error) {
            console.error('Error sending email:', error)
            toast({
                title: "Erro ao enviar email",
                description: "Tente novamente mais tarde.",
                variant: "destructive",
            })
        } finally {
            setSendingEmail(false)
        }
    }

    const handleShareWhatsApp = () => {
        if (!response) return

        const currentUrl = window.location.href
        const text = `🎯 Minha Análise de Potencial - MENVO

Pontuação: ${response.score}/1000

Acabei de fazer uma análise personalizada no RecnPlay e descobri meu potencial de crescimento!

Veja meu resultado: ${currentUrl}

Conheça o MENVO - plataforma gratuita de mentoria: https://menvo.com.br`

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
        window.open(whatsappUrl, '_blank')
    }

    const handleShareLinkedIn = () => {
        if (!response) return

        const currentUrl = window.location.href
        const text = `Acabei de fazer uma análise de potencial no MENVO e descobri insights incríveis sobre meu crescimento profissional! 

Pontuação: ${response.score}/1000

Conheça o MENVO - plataforma gratuita de mentoria que conecta jovens a mentores voluntários.

#MENVO #Mentoria #DesenvolvimentoProfissional #RecnPlay2025`

        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}&summary=${encodeURIComponent(text)}`
        window.open(linkedinUrl, '_blank')
    }

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
            <AnimatedBackground>
                <div className="flex items-center justify-center min-h-screen">
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
                <AnimatedBackground>
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
                                            Sua pontuação foi acima de 700! Escolha entre caneta ou botton e retire no estande do MENVO no RecnPlay.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <Button
                                                variant={selectedGift === 'caneta' ? 'default' : 'outline'}
                                                className="h-32 text-lg flex-col p-4"
                                                onClick={() => setSelectedGift('caneta')}
                                            >
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="relative w-16 h-16">
                                                        <Image
                                                            src="/images/menvo-caneta.jpeg"
                                                            alt="Caneta MENVO"
                                                            fill
                                                            className="object-cover rounded-lg"
                                                        />
                                                    </div>
                                                    <span className="font-semibold">Caneta MENVO</span>
                                                    {selectedGift === 'caneta' && <CheckCircle className="h-5 w-5 text-green-600" />}
                                                </div>
                                            </Button>
                                            <Button
                                                variant={selectedGift === 'botton' ? 'default' : 'outline'}
                                                className="h-32 text-lg flex-col p-4"
                                                onClick={() => setSelectedGift('botton')}
                                            >
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="relative w-16 h-16">
                                                        <Image
                                                            src="/images/menvo-botton.jpeg"
                                                            alt="Botton MENVO"
                                                            fill
                                                            className="object-cover rounded-lg"
                                                        />
                                                    </div>
                                                    <span className="font-semibold">Botton MENVO</span>
                                                    {selectedGift === 'botton' && <CheckCircle className="h-5 w-5 text-green-600" />}
                                                </div>
                                            </Button>
                                        </div>
                                        <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                                            <p className="text-sm text-center text-green-800 dark:text-green-200 font-medium">
                                                ⚠️ Importante: Você deve escolher UM ou OUTRO brinde
                                            </p>
                                            {selectedGift && (
                                                <p className="text-sm text-center mt-2 text-green-800 dark:text-green-200">
                                                    ✅ Você escolheu: <strong>{selectedGift === 'caneta' ? 'Caneta MENVO' : 'Botton MENVO'}</strong>
                                                    <br />
                                                    Mostre este resultado no estande do MENVO para retirar seu brinde!
                                                </p>
                                            )}
                                        </div>
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
                                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <p className="text-sm text-blue-800 dark:text-blue-200">
                                            💡 <strong>Status dos Mentores:</strong> Mostramos mentores reais da plataforma baseados no seu perfil.
                                            "Disponível" = aceita novos mentorados | "Agenda lotada" = temporariamente ocupado
                                        </p>
                                    </div>
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
                                                <Badge variant={mentor.disponivel ? 'default' : 'secondary'} className={mentor.disponivel ? 'bg-green-600 hover:bg-green-700' : ''}>
                                                    {mentor.disponivel ? '✅ Disponível' : '📅 Agenda lotada'}
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

                                </CardContent>
                            </Card>

                            {/* Share Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-center">Compartilhar Resultados</CardTitle>
                                    <CardDescription className="text-center">
                                        Envie sua análise por email ou compartilhe com amigos
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            onClick={handleSendEmail}
                                            disabled={sendingEmail}
                                            className="w-full"
                                        >
                                            {sendingEmail ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Enviando...
                                                </>
                                            ) : (
                                                <>
                                                    <Mail className="mr-2 h-4 w-4" />
                                                    Enviar por Email
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            onClick={handleShareWhatsApp}
                                            className="w-full bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                                        >
                                            <Share2 className="mr-2 h-4 w-4" />
                                            WhatsApp
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            onClick={handleShareLinkedIn}
                                            className="w-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                                        >
                                            <Share2 className="mr-2 h-4 w-4" />
                                            LinkedIn
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </AnimatedBackground>
                )
}
