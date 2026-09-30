"use client"

import { MenvoDots } from "@/components/ui/menvo-loader"
import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Link, useRouter } from "@/i18n/routing"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Lightbulb, Target, ArrowRight, CheckCircle, Sparkles, Mail, Share2, ExternalLink, Linkedin, Loader2, Printer } from "lucide-react"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "next-intl"
import { quizService } from "@/lib/services/quiz/quiz.service"
import { ShareDiagnosticModal } from "@/components/diagnostic/ShareDiagnosticModal"
import { SaveAnalysisBanner } from "@/components/quiz/SaveAnalysisBanner"

interface AnalysisResult {
    precisa_refazer?: boolean
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
    ai_analysis: AnalysisResult
    processed_at: string
    is_owner?: boolean
}

export default function QuizResultsPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()
    const t = useTranslations('quiz');
    const [loading, setLoading] = useState(true)
    const [response, setResponse] = useState<QuizResponse | null>(null)
    const [sendingEmail, setSendingEmail] = useState(false)
    const [mentorSlugMap, setMentorSlugMap] = useState<Record<string, string>>({})
    const [mentorIdMap, setMentorIdMap] = useState<Record<string, string>>({})
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    // Captured once on mount; the results e-mail link carries this so the
    // "save to account" banner can create an account for this address.
    const [accountToken] = useState(() => searchParams.get('k'))

    useEffect(() => {
        if (params.id) {
            loadResults()
        }
    }, [params.id])

    // The token proves e-mail receipt, not "safe to share" - drop it from the
    // address bar so it never ends up in a WhatsApp/LinkedIn share link.
    useEffect(() => {
        if (accountToken && typeof window !== "undefined") {
            const url = new URL(window.location.href)
            url.searchParams.delete('k')
            window.history.replaceState(null, '', url.pathname + url.search)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handlePrint = () => {
        window.print()
    }

    const handleSendEmail = async () => {
        if (!response) return

        setSendingEmail(true)
        try {
            await quizService.sendResultsEmail(response.id)

            toast({
                title: t('quiz_results.email_sent_toast_title'),
                description: t('quiz_results.email_sent_toast_description')
            })
        } catch (error) {
            console.error("Error sending email:", error)
            toast({
                title: t('quiz_results.error_sending_email_toast_title'),
                description: t('quiz_results.error_sending_email_toast_description'),
                variant: "destructive"
            })
        } finally {
            setSendingEmail(false)
        }
    }

    const handleShareWhatsApp = () => {
        if (!response) return

        const currentUrl = window.location.href
        const text = t('quiz_results.potential_analysis_whatsapp_message', { currentUrl });

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
        window.open(whatsappUrl, "_blank")
    }

    const handleShareLinkedIn = () => {
        if (!response) return

        const currentUrl = window.location.href
        const text = t('quiz_results.potential_analysis_linkedin_message', { currentUrl });

        const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(
            text
        )}`
        window.open(linkedinUrl, "_blank")
    }

    const loadResults = async (attempt = 0) => {
        if (!params.id) return
        try {
            const data = await quizService.getQuizResponseById(params.id as string)
            if (!data) throw new Error("Quiz response not found")

            const res = data as unknown as QuizResponse;

            // Wait for processing if not done yet
            if (!res.processed_at) {
                // ~4 min without a result: stop spinning and show the error
                // toast (e.g. the monthly AI budget is exhausted).
                if (attempt >= 120) throw new Error("Quiz analysis timed out")
                // Every ~70s, ask for the analysis again: covers a request
                // that died mid-analysis (its 2-min claim expires) or a tab
                // closed right after submitting. The server-side claim makes
                // a duplicate request a no-op.
                if (attempt > 0 && attempt % 35 === 0) {
                    quizService.requestAnalysis(res.id)
                }
                setTimeout(() => loadResults(attempt + 1), 2000) // Retry after 2 seconds
                return
            }

            setResponse(res)

            // Resolve real mentor profile slugs if available
            const mentorNames = (res.ai_analysis?.mentores_sugeridos || [])
                .map((m) => m.mentor_nome?.trim())
                .filter((name): name is string => Boolean(name))

            if (mentorNames.length > 0) {
                try {
                    const res = await fetch(`/api/mentors/lookup?names=${encodeURIComponent(mentorNames.join(","))}`)
                    const { mentors: mentorsFound } = await res.json()

                    if (mentorsFound && (mentorsFound as any[]).length > 0) {
                        const slugMap: Record<string, string> = {}
                        const idMap: Record<string, string> = {}
                        for (const m of (mentorsFound as any[])) {
                            if (m.full_name) {
                                const key = m.full_name.toLowerCase()
                                slugMap[key] = m.slug || m.id || ""
                                // Never fall back to slug here - sharing needs the real
                                // UUID (POST /api/diagnostic/shares' mentor_id).
                                if (m.id) idMap[key] = m.id
                            }
                        }
                        setMentorSlugMap(slugMap)
                        setMentorIdMap(idMap)
                    }
                } catch (e) {
                    console.warn("Could not resolve mentor slugs:", e)
                }
            }
        } catch (error) {
            console.error("Error loading results:", error)
            toast({
                title: t('quiz_results.error_loading_results_toast_title'),
                description: t('quiz_results.error_loading_results_toast_description'),
                variant: "destructive"
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
                                <MenvoDots />
                                <div className="text-center">
                                    <h3 className="font-semibold text-lg">
                                        {t('quiz_results.processing_analysis')}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {t('quiz_results.ai_is_analyzing')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AnimatedBackground>
        )
    }

    const analysis = response.ai_analysis

    // Se precisa refazer, mostra interface especial
    if (analysis.precisa_refazer) {
        return (
            <AnimatedBackground>
                <div className="container mx-auto px-4 py-12">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center space-y-6 mb-8">
                            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-primary text-sm font-medium">
                                <Target className="h-4 w-4" />
                                {t('quiz_results.incomplete_analysis')}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-primary">
                                {analysis.titulo_personalizado}
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                {analysis.resumo_motivador}
                            </p>
                        </div>

                        <Card className="border-2 border-primary/30 bg-primary/5">
                            <CardContent className="pt-6">
                                <div className="text-center space-y-4">
                                    <Target className="h-16 w-16 text-primary mx-auto" />
                                    <h3 className="text-xl font-semibold text-foreground">
                                        {t('quiz_results.lets_try_again')}
                                    </h3>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        {analysis.mensagem_final}
                                    </p>
                                    <div className="pt-4">
                                        <Button
                                            size="lg"
                                            onClick={() => router.push('/quiz')}
                                            className="bg-primary hover:bg-primary/90 text-white"
                                        >
                                            {t('quiz_results.retake_quiz')}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Dicas para melhorar as respostas */}
                        {analysis.conselhos_praticos && analysis.conselhos_praticos.length > 0 && (
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Lightbulb className="h-5 w-5 text-primary" />
                                        {t('quiz_results.tips_for_better_analysis')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {analysis.conselhos_praticos.map((conselho, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                                <span>{conselho}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </AnimatedBackground>
        )
    }

    const mentorsCard = (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    <CardTitle>{t('quiz_results.suggested_mentors')}</CardTitle>
                </div>
                <CardDescription>
                    {t('quiz_results.based_on_interests')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground pb-1">
                    {t('quiz_results.mentor_status_tooltip')}
                </p>
                {analysis.mentores_sugeridos.map((mentor, index) => {
                    const resolvedSlug = mentor.mentor_nome
                        ? mentorSlugMap[mentor.mentor_nome.toLowerCase()]
                        : null;
                    const mentorHref = resolvedSlug
                        ? `/mentors/${resolvedSlug}`
                        : mentor.mentor_nome
                        ? `/mentors?search=${encodeURIComponent(mentor.mentor_nome)}`
                        : `/mentors`;

                    return (
                        <Link
                            key={index}
                            href={mentorHref}
                            className="block p-5 border rounded-2xl space-y-3 hover:border-primary/60 hover:shadow-md hover:bg-muted/10 transition-all duration-200 group bg-card"
                        >
                            <div className="flex-1">
                                <h4 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                                    {mentor.tipo}
                                </h4>
                                {mentor.mentor_nome && (
                                    <p className="text-sm font-medium text-muted-foreground mt-0.5">
                                        {t('quiz_results.mentor')}: <span className="text-foreground font-semibold">{mentor.mentor_nome}</span>
                                    </p>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {mentor.razao}
                            </p>
                            <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/40">
                                <span className="text-xs text-muted-foreground group-hover:text-primary/80 transition-colors">
                                    {mentor.mentor_nome
                                        ? t('quiz_results.mentor')
                                        : t('quiz_results.explore_mentors')}
                                </span>
                                <span className="print:hidden inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground font-medium text-xs px-3 py-1.5 group-hover:bg-[#006276] transition-all shadow-sm shadow-primary/20">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    <span>{mentor.mentor_nome ? t('quiz_results.view_mentor_profile') : t('quiz_results.explore_mentors')}</span>
                                </span>
                            </div>
                        </Link>
                    );
                })}
                <div className="pt-2 text-center print:hidden">
                    <Button
                        variant="outline"
                        asChild
                        className="rounded-xl border font-medium text-xs hover:bg-muted/50 transition-all"
                    >
                        <Link href="/mentors">{t('quiz_results.explore_all_mentors')}</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )

    return (
        <AnimatedBackground>
            <div className="container mx-auto px-4 py-12 print:py-4">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-primary text-sm font-medium">
                            <CheckCircle className="h-4 w-4" />
                            {t('quiz_results.personalized_analysis')}
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                            {analysis.titulo_personalizado}
                        </h1>

                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            {analysis.resumo_motivador}
                        </p>

                        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground max-w-xl mx-auto pt-1">
                            <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                            {t('quiz_results.ai_disclaimer')}
                        </p>
                    </div>

                    {accountToken && (
                        <div className="print:hidden">
                            <SaveAnalysisBanner quizId={response.id} token={accountToken} />
                        </div>
                    )}

                    {/* Two-column layout: analysis on the left, mentors + actions on the right */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {/* Main column */}
                        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
                            {/* Practical Advice */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Lightbulb className="h-6 w-6 text-primary" />
                                        <CardTitle>{t('quiz_results.practical_advice')}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {analysis.conselhos_praticos.map((conselho, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
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
                                        <Target className="h-6 w-6 text-primary" />
                                        <CardTitle>{t('quiz_results.next_steps')}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {analysis.proximos_passos.map((passo, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                                <span>{passo}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            {/* Development Areas */}
                            {analysis.areas_desenvolvimento &&
                                analysis.areas_desenvolvimento.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>{t('quiz_results.development_areas')}</CardTitle>
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

                            {/* Final Message */}
                            <Card className="border-2 border-primary/20 bg-primary/5">
                                <CardContent className="pt-6">
                                    <p className="text-center text-lg font-medium mb-4 text-primary">
                                        {analysis.mensagem_final}
                                    </p>

                                    {/* Potential Mentor Section */}
                                    {analysis.potencial_mentor && (
                                        <div className="mt-6 p-4 bg-card rounded-lg border border-primary/20">
                                            <div className="flex items-start gap-3">
                                                <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <h4 className="font-semibold text-base text-foreground">
                                                        {t('quiz_results.final_message_potential_mentor')}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {t('quiz_results.final_message_potential_mentor_description')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar: mentors + actions */}
                        <div className="lg:col-span-1 space-y-6 order-1 lg:order-2">
                            {mentorsCard}

                            {/* Share / Print Actions */}
                            <Card className="print:hidden">
                                <CardHeader>
                                    <CardTitle className="text-center text-base">
                                        {t('quiz_results.share_results')}
                                    </CardTitle>
                                    <CardDescription className="text-center">
                                        {t('quiz_results.share_results_description')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {response.is_owner && (
                                        <Button
                                            size="lg"
                                            onClick={() => setIsShareModalOpen(true)}
                                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-sm active:scale-[0.98]"
                                        >
                                            <Users className="mr-2 h-4 w-4" />
                                            {t('quiz_results.share_with_mentor')}
                                        </Button>
                                    )}
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={handlePrint}
                                        className="w-full rounded-xl"
                                    >
                                        <Printer className="mr-2 h-4 w-4" />
                                        {t('quiz_results.print')}
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={handleSendEmail}
                                        disabled={sendingEmail}
                                        className="w-full rounded-xl"
                                    >
                                        {sendingEmail ? (
                                            <>
                                                <Loader2 className="mr-2 animate-spin h-4 w-4" />
                                                {t('quiz_results.sending')}
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="mr-2 h-4 w-4" />
                                                {t('quiz_results.send_by_email')}
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={handleShareWhatsApp}
                                        className="w-full bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-xl"
                                    >
                                        <Share2 className="mr-2 h-4 w-4" />
                                        {t('quiz_results.whatsapp')}
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="default"
                                        onClick={handleShareLinkedIn}
                                        className="w-full bg-[#0a66c2] text-white hover:bg-[#004182] border-none rounded-xl"
                                    >
                                        <Linkedin className="mr-2 h-4 w-4 fill-current" />
                                        {t('quiz_results.linkedin')}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <ShareDiagnosticModal
                        isOpen={isShareModalOpen}
                        onClose={() => setIsShareModalOpen(false)}
                        quizResponseId={response.id}
                        suggestedMentors={analysis.mentores_sugeridos}
                        mentorIdMap={mentorIdMap}
                    />
                </div>
            </div>
        </AnimatedBackground>
    )
}
