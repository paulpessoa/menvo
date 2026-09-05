"use client"

import Link from "next/link"
import { Sparkles, ArrowRight, RotateCcw, BrainCircuit, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import type { QuizResponseSummary } from "@/lib/types/models/quiz"

interface MenteeQuizCTAProps {
  quizResponse: QuizResponseSummary | null
  loading?: boolean
}

/**
 * High-conversion Onboarding & Activation CTA for Mentees.
 * Connects newly registered or existing mentees to the career quiz diagnostic
 * and displays their matched results/recommendations.
 */
export function MenteeQuizCTA({ quizResponse, loading }: MenteeQuizCTAProps) {
  const t = useTranslations("dashboard.mentee.quiz")

  if (loading) {
    return (
      <div className="w-full h-36 rounded-2xl bg-muted/40 animate-pulse border border-border/50" />
    )
  }

  // State A: Mentee has already completed the assessment
  if (quizResponse) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-purple-500/5 to-blue-500/5 p-6 shadow-sm transition-all hover:shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t("completedBadge")}
              </Badge>
              {quizResponse.development_areas?.slice(0, 2).map((area, idx) => (
                <Badge key={idx} variant="outline" className="text-xs bg-background/50">
                  {area}
                </Badge>
              ))}
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-primary" />
              {t("completedTitle")}
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {t("completedDescription")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button asChild className="rounded-full px-6 font-bold shadow-sm">
              <Link href={`/quiz/results/${quizResponse.id}`}>
                {t("viewAnalysis")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full text-muted-foreground hover:text-foreground">
              <Link href="/quiz">
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                {t("retakeQuiz")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // State B: New mentee has not taken the quiz yet (Primary Activation)
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 md:p-8 text-white shadow-lg transition-all hover:shadow-xl">
      <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white/20 text-white hover:bg-white/30 border-white/30 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              {t("badgeAi")}
            </Badge>
            <Badge variant="outline" className="text-white border-white/30 bg-black/10">
              {t("badgeTime")}
            </Badge>
            <Badge variant="outline" className="text-white border-white/30 bg-black/10">
              {t("badgeFree")}
            </Badge>
          </div>

          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
            {t("ctaTitle")}
          </h2>

          <p className="text-white/90 text-sm md:text-base leading-relaxed">
            {t("ctaDescription")}
          </p>
        </div>

        <div className="shrink-0">
          <Button
            asChild
            size="lg"
            className="rounded-full bg-white text-indigo-700 hover:bg-white/90 font-bold px-8 shadow-md hover:scale-105 transition-all text-base h-12"
          >
            <Link href="/quiz">
              <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
              {t("ctaButton")}
              <ArrowRight className="w-5 h-5 ml-2 text-indigo-600" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
