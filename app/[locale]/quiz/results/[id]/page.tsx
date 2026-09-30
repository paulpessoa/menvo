"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import {
    ArrowRight,
    Check,
    Link2,
    Linkedin,
    Loader2,
    MessageCircle,
    Printer,
    RotateCcw,
    Send,
    Sparkles
} from "lucide-react"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { quizService } from "@/lib/services/quiz/quiz.service"
import { createClient } from "@/lib/utils/supabase/client"
import { ShareDiagnosticModal } from "@/components/diagnostic/ShareDiagnosticModal"

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
}

// Printing: show only the result (no site header, footer or floating widgets)
// and drop the tinted background so it prints clean on paper / PDF.
const PRINT_STYLES = `
@media print {
  @page { margin: 16mm; }
  body * { visibility: hidden; }
  #quiz-result, #quiz-result * { visibility: visible; }
  #quiz-result { position: absolute; top: 0; left: 0; right: 0; }
  body { background: #fff !important; }
}
`

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <section className="break-inside-avoid-page">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
                {action}
            </div>
            {children}
        </section>
    )
}

export default function QuizResultsPage() {
    const params = useParams()
    const { toast } = useToast()
    const t = useTranslations("quiz")
    const locale = useLocale()
    const [loading, setLoading] = useState(true)
    const [response, setResponse] = useState<QuizResponse | null>(null)
    const [mentorSlugMap, setMentorSlugMap] = useState<Record<string, string>>({})
    const [mentorIdMap, setMentorIdMap] = useState<Record<string, string>>({})
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (params.id) {
            loadResults()
        }
    }, [params.id])

    const pageUrl = () => window.location.href.split("?")[0]

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(pageUrl())
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast({ title: pageUrl() })
        }
    }

    const handleShareWhatsApp = () => {
        const text = t("quiz_results.whatsapp_message", { url: pageUrl() })
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener")
    }

    // share-offsite renders the page's Open Graph preview (title + image).
    const handleShareLinkedIn = () => {
        window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl())}`,
            "_blank",
            "noopener"
        )
    }

    const loadResults = async (attempt = 0) => {
        if (!params.id) return
        try {
            const data = await quizService.getQuizResponseById(params.id as string)
            if (!data) throw new Error("Quiz response not found")

            const res = data as unknown as QuizResponse

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
                    const supabase = createClient()
                    const { data: mentorsFound } = await (supabase
                        .from("mentors_view") as any)
                        .select("full_name, slug, id")
                        .in("full_name", mentorNames)

                    if (mentorsFound && (mentorsFound as any[]).length > 0) {
                        const slugMap: Record<string, string> = {}
                        const idMap: Record<string, string> = {}
                        for (const m of (mentorsFound as any[])) {
                            if (m.full_name) {
                                slugMap[m.full_name.toLowerCase()] = m.slug || m.id || ""
                                idMap[m.full_name.toLowerCase()] = m.id || ""
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
                title: t("quiz_results.error_loading_results_toast_title"),
                description: t("quiz_results.error_loading_results_toast_description"),
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    if (loading || !response) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-accent/60 to-background px-4">
                <div className="flex flex-col items-center gap-4 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <div>
                        <p className="text-lg font-semibold">{t("quiz_results.processing_analysis")}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t("quiz_results.ai_is_analyzing")}</p>
                    </div>
                </div>
            </div>
        )
    }

    const analysis = response.ai_analysis

    // Answers too vague to analyse: one clear message and one action.
    if (analysis.precisa_refazer) {
        return (
            <div className="bg-gradient-to-b from-accent/60 to-background">
                <div className="mx-auto max-w-2xl px-4 py-16 text-center">
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{analysis.titulo_personalizado}</h1>
                    <p className="mt-4 text-lg text-muted-foreground">{analysis.resumo_motivador}</p>

                    {analysis.conselhos_praticos?.length > 0 && (
                        <ul className="mx-auto mt-8 max-w-md space-y-3 text-left">
                            {analysis.conselhos_praticos.map((tip, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    <Button asChild size="lg" className="mt-10 rounded-xl">
                        <Link href="/quiz">
                            {t("quiz_results.retake_quiz")}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    const generatedOn = response.processed_at
        ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(response.processed_at))
        : null

    const shareButtonClass = "rounded-xl gap-2"

    return (
        <div className="bg-gradient-to-b from-accent/70 via-background to-background print:bg-none">
            <style>{PRINT_STYLES}</style>

            <article id="quiz-result" className="mx-auto max-w-3xl px-4 pb-16 pt-10 md:pt-14">
                {/* Headline */}
                <header className="border-b pb-8">
                    <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                        {t("quiz_results.eyebrow")}
                    </p>
                    <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl">
                        {analysis.titulo_personalizado}
                    </h1>
                    <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                        {analysis.resumo_motivador}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2 print:hidden">
                        <Button variant="outline" size="sm" className={shareButtonClass} onClick={handleCopyLink}>
                            {copied ? <Check className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4" />}
                            {copied ? t("quiz_results.link_copied") : t("quiz_results.copy_link")}
                        </Button>
                        <Button variant="outline" size="sm" className={shareButtonClass} onClick={handleShareWhatsApp}>
                            <MessageCircle className="h-4 w-4" />
                            {t("quiz_results.whatsapp")}
                        </Button>
                        <Button variant="outline" size="sm" className={shareButtonClass} onClick={handleShareLinkedIn}>
                            <Linkedin className="h-4 w-4" />
                            {t("quiz_results.linkedin")}
                        </Button>
                        <Button variant="outline" size="sm" className={shareButtonClass} onClick={() => window.print()}>
                            <Printer className="h-4 w-4" />
                            {t("quiz_results.print")}
                        </Button>
                    </div>
                </header>

                <div className="mt-10 space-y-12">
                    {/* Action plan — the core of the result, numbered and first */}
                    {analysis.proximos_passos?.length > 0 && (
                        <Section title={t("quiz_results.action_plan")}>
                            <ol className="space-y-4">
                                {analysis.proximos_passos.map((step, index) => (
                                    <li key={index} className="flex gap-4 rounded-2xl border bg-card p-5 break-inside-avoid">
                                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                                            {index + 1}
                                        </span>
                                        <p className="pt-1 leading-relaxed">{step}</p>
                                    </li>
                                ))}
                            </ol>
                        </Section>
                    )}

                    {/* Suggested mentors */}
                    {analysis.mentores_sugeridos?.length > 0 && (
                        <Section
                            title={t("quiz_results.suggested_mentors")}
                            action={
                                <Button size="sm" className="rounded-xl gap-2 print:hidden" onClick={() => setIsShareModalOpen(true)}>
                                    <Send className="h-4 w-4" />
                                    {t("quiz_results.share_with_mentor")}
                                </Button>
                            }
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                {analysis.mentores_sugeridos.map((mentor, index) => {
                                    const name = mentor.mentor_nome?.trim()
                                    const slug = name ? mentorSlugMap[name.toLowerCase()] : null
                                    const href = slug
                                        ? `/mentors/${slug}`
                                        : name
                                        ? `/mentors?search=${encodeURIComponent(name)}`
                                        : "/mentors"

                                    return (
                                        <Link
                                            key={index}
                                            href={href}
                                            className="group flex flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-primary/60 break-inside-avoid"
                                        >
                                            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                                                {mentor.tipo}
                                            </p>
                                            {name && (
                                                <p className="mt-2 flex items-center gap-2 text-lg font-bold">
                                                    {name}
                                                    {mentor.disponivel && (
                                                        <span
                                                            className="h-2 w-2 rounded-full bg-green-500"
                                                            title={t("quiz_results.available")}
                                                            aria-label={t("quiz_results.available")}
                                                        />
                                                    )}
                                                </p>
                                            )}
                                            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                                                {mentor.razao}
                                            </p>
                                            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary print:hidden">
                                                {name ? t("quiz_results.view_profile") : t("quiz_results.find_mentors")}
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                            </span>
                                        </Link>
                                    )
                                })}
                            </div>
                            <Link
                                href="/mentors"
                                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary print:hidden"
                            >
                                {t("quiz_results.all_mentors")}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Section>
                    )}

                    {/* Practical advice */}
                    {analysis.conselhos_praticos?.length > 0 && (
                        <Section title={t("quiz_results.practical_advice")}>
                            <ul className="space-y-3 rounded-2xl bg-accent p-6">
                                {analysis.conselhos_praticos.map((tip, index) => (
                                    <li key={index} className="flex items-start gap-3 break-inside-avoid">
                                        <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                                        <span className="leading-relaxed">{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {/* Focus areas */}
                    {analysis.areas_desenvolvimento?.length > 0 && (
                        <Section title={t("quiz_results.development_areas")}>
                            <div className="flex flex-wrap gap-2">
                                {analysis.areas_desenvolvimento.map((area, index) => (
                                    <span
                                        key={index}
                                        className="rounded-full border border-primary/30 px-3 py-1.5 text-sm font-medium text-foreground"
                                    >
                                        {area}
                                    </span>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Closing message */}
                    {analysis.mensagem_final && (
                        <blockquote className="border-l-4 border-primary pl-5 text-lg font-medium leading-relaxed text-foreground break-inside-avoid">
                            {analysis.mensagem_final}
                        </blockquote>
                    )}

                    {/* Potential mentor */}
                    {analysis.potencial_mentor && (
                        <div className="flex flex-col gap-4 rounded-2xl bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between print:hidden">
                            <div>
                                <p className="text-lg font-bold">{t("quiz_results.final_message_potential_mentor")}</p>
                                <p className="mt-1 text-sm opacity-90">
                                    {t("quiz_results.final_message_potential_mentor_description")}
                                </p>
                            </div>
                            <Button asChild variant="secondary" className="rounded-xl shrink-0">
                                <Link href="/signup">{t("quiz_results.become_mentor")}</Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer: AI disclaimer + retake */}
                <footer className="mt-14 border-t pt-6 text-xs leading-relaxed text-muted-foreground">
                    <p className="flex items-start gap-2">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                        <span>
                            {t("quiz_results.ai_disclaimer")}
                            {generatedOn && <> · {t("quiz_results.generated_on", { date: generatedOn })}</>}
                        </span>
                    </p>
                    <Link
                        href="/quiz"
                        className="mt-3 inline-flex items-center gap-1.5 font-medium hover:text-primary print:hidden"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {t("quiz_results.retake_link")}
                    </Link>
                </footer>
            </article>

            <ShareDiagnosticModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                quizResponseId={response.id}
                suggestedMentors={analysis.mentores_sugeridos}
                mentorIdMap={mentorIdMap}
            />
        </div>
    )
}
