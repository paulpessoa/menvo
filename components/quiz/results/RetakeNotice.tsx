"use client"

import { ArrowRight, Check } from "lucide-react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import type { QuizAnalysis } from "@/lib/domain/quiz/quiz.entity"

/**
 * Answers too vague to analyse: one clear message and one action (retake).
 * The analysis carries `precisa_refazer` instead of being an error so the
 * e-mail and the shared link never present it as a real diagnostic.
 */
export function RetakeNotice({ analysis }: { analysis: QuizAnalysis }) {
  const t = useTranslations("quiz")

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
